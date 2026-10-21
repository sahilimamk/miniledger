import fs from 'fs';
import path from 'path';
import { pool } from '../../db/pool';
import { HttpError } from '../../utils/httpError';
import { UPLOADS_DIR } from '../../middleware/upload';
import { rupeesToPaise, paiseToRupees } from '../../utils/money';
import { isOverdue } from '../../utils/dates';
import {
  Loan,
  LoanRow,
  CreateLoanInput,
  PatchLoanInput,
} from './loans.types';

const COLUMNS =
  'id, friend_name, friend_phone, amount_cents, due_date, note, receipt_url, repaid_at, created_at';

function toLoan(row: LoanRow): Loan {
  const repaid = row.repaid_at !== null;
  return {
    id: row.id,
    friendName: row.friend_name,
    friendPhone: row.friend_phone,
    amount: paiseToRupees(row.amount_cents),
    dueDate: row.due_date,
    note: row.note,
    receiptUrl: row.receipt_url,
    repaid,
    repaidAt: row.repaid_at ? row.repaid_at.toISOString() : null,
    isOverdue: isOverdue(row.due_date, repaid),
    createdAt: row.created_at.toISOString(),
  };
}

function isPgError(err: unknown, code: string): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === code
  );
}

/** Fetch one loan owned by the user; null when missing or the id is malformed. */
async function findLoanRow(
  userId: string,
  id: string,
): Promise<LoanRow | null> {
  try {
    const { rows } = await pool.query<LoanRow>(
      `SELECT ${COLUMNS} FROM loans WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return rows[0] ?? null;
  } catch (err) {
    // 22P02 = invalid uuid syntax; treat as not found, never a 500.
    if (isPgError(err, '22P02')) return null;
    throw err;
  }
}

export async function createLoan(
  userId: string,
  input: CreateLoanInput,
): Promise<Loan> {
  const { rows } = await pool.query<LoanRow>(
    `INSERT INTO loans (user_id, friend_name, friend_phone, amount_cents, due_date, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [
      userId,
      input.friendName,
      input.friendPhone ?? null,
      rupeesToPaise(input.amount),
      input.dueDate,
      input.note ?? null,
    ],
  );
  return toLoan(rows[0]);
}

export async function listLoans(userId: string): Promise<Loan[]> {
  const { rows } = await pool.query<LoanRow>(
    `SELECT ${COLUMNS} FROM loans
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC`,
    [userId],
  );
  return rows.map(toLoan);
}

export async function getLoan(userId: string, id: string): Promise<Loan> {
  const row = await findLoanRow(userId, id);
  if (!row) throw new HttpError(404, 'loan not found');
  return toLoan(row);
}

export async function updateLoan(
  userId: string,
  id: string,
  patch: PatchLoanInput,
): Promise<Loan> {
  const sets: string[] = [];
  const values: unknown[] = [];
  const push = (column: string, value: unknown) => {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  };

  if (patch.friendName !== undefined) push('friend_name', patch.friendName);
  if (patch.amount !== undefined)
    push('amount_cents', rupeesToPaise(patch.amount));
  if (patch.dueDate !== undefined) push('due_date', patch.dueDate);
  if (patch.note !== undefined) push('note', patch.note);
  if (patch.friendPhone !== undefined) push('friend_phone', patch.friendPhone);

  if (sets.length === 0) return getLoan(userId, id); // no-op patch

  sets.push('updated_at = now()');
  values.push(id, userId);
  try {
    const { rows } = await pool.query<LoanRow>(
      `UPDATE loans SET ${sets.join(', ')}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING ${COLUMNS}`,
      values,
    );
    if (!rows[0]) throw new HttpError(404, 'loan not found');
    return toLoan(rows[0]);
  } catch (err) {
    if (isPgError(err, '22P02')) throw new HttpError(404, 'loan not found');
    throw err;
  }
}

export async function repayLoan(userId: string, id: string): Promise<Loan> {
  let rows: LoanRow[];
  try {
    ({ rows } = await pool.query<LoanRow>(
      `UPDATE loans SET repaid_at = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2 AND repaid_at IS NULL
       RETURNING ${COLUMNS}`,
      [id, userId],
    ));
  } catch (err) {
    if (isPgError(err, '22P02')) throw new HttpError(404, 'loan not found');
    throw err;
  }
  if (rows[0]) return toLoan(rows[0]);

  // Nothing updated: the loan is either not this user's (404) or already
  // repaid (409).
  const existing = await findLoanRow(userId, id);
  if (!existing) throw new HttpError(404, 'loan not found');
  throw new HttpError(409, 'loan already repaid');
}

/**
 * Best-effort removal of a stored receipt file. ENOENT (already gone) and
 * any other fs failure are ignored: file cleanup must never fail the
 * request that triggered it.
 */
async function removeReceiptFile(receiptUrl: string | null): Promise<void> {
  if (!receiptUrl) return;
  const filePath = path.join(UPLOADS_DIR, path.basename(receiptUrl));
  await fs.promises.unlink(filePath).catch(() => undefined);
}

export async function deleteLoan(userId: string, id: string): Promise<void> {
  try {
    const { rows } = await pool.query<{ receipt_url: string | null }>(
      'DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING receipt_url',
      [id, userId],
    );
    if (!rows[0]) throw new HttpError(404, 'loan not found');
    // Row is gone; its receipt file must not be orphaned on disk.
    await removeReceiptFile(rows[0].receipt_url);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (isPgError(err, '22P02')) throw new HttpError(404, 'loan not found');
    throw err;
  }
}

export async function setReceiptUrl(
  userId: string,
  id: string,
  receiptUrl: string,
): Promise<Loan> {
  // Remember the current receipt so a successful replacement can remove
  // the old file instead of orphaning it.
  const previous = await findLoanRow(userId, id);
  if (!previous) throw new HttpError(404, 'loan not found');
  try {
    const { rows } = await pool.query<LoanRow>(
      `UPDATE loans SET receipt_url = $1, updated_at = now()
       WHERE id = $2 AND user_id = $3
       RETURNING ${COLUMNS}`,
      [receiptUrl, id, userId],
    );
    if (!rows[0]) throw new HttpError(404, 'loan not found');
    if (previous.receipt_url && previous.receipt_url !== receiptUrl) {
      await removeReceiptFile(previous.receipt_url);
    }
    return toLoan(rows[0]);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (isPgError(err, '22P02')) throw new HttpError(404, 'loan not found');
    throw err;
  }
}
