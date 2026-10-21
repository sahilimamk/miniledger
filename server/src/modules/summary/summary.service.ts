import { pool } from '../../db/pool';
import { paiseToRupees } from '../../utils/money';

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdueAmount: number;
  counts: { total: number; repaid: number; pending: number; overdue: number };
}

interface SummaryRow {
  total_lent: string;
  total_repaid: string;
  outstanding: string;
  overdue_amount: string;
  total_count: number;
  repaid_count: number;
  pending_count: number;
  overdue_count: number;
}

/**
 * All aggregates in one query. Overdue mirrors the contract:
 * pending (repaid_at IS NULL) AND due_date before today (CURRENT_DATE is
 * the database session's local date — same host as the server).
 */
export async function getSummary(userId: string): Promise<Summary> {
  const { rows } = await pool.query<SummaryRow>(
    `SELECT
       COALESCE(SUM(amount_cents), 0) AS total_lent,
       COALESCE(SUM(amount_cents) FILTER (WHERE repaid_at IS NOT NULL), 0) AS total_repaid,
       COALESCE(SUM(amount_cents) FILTER (WHERE repaid_at IS NULL), 0) AS outstanding,
       COALESCE(SUM(amount_cents) FILTER (WHERE repaid_at IS NULL AND due_date < CURRENT_DATE), 0) AS overdue_amount,
       COUNT(*)::int AS total_count,
       COUNT(*) FILTER (WHERE repaid_at IS NOT NULL)::int AS repaid_count,
       COUNT(*) FILTER (WHERE repaid_at IS NULL)::int AS pending_count,
       COUNT(*) FILTER (WHERE repaid_at IS NULL AND due_date < CURRENT_DATE)::int AS overdue_count
     FROM loans
     WHERE user_id = $1`,
    [userId],
  );
  const r = rows[0];
  return {
    totalLent: paiseToRupees(r.total_lent),
    totalRepaid: paiseToRupees(r.total_repaid),
    outstanding: paiseToRupees(r.outstanding),
    overdueAmount: paiseToRupees(r.overdue_amount),
    counts: {
      total: r.total_count,
      repaid: r.repaid_count,
      pending: r.pending_count,
      overdue: r.overdue_count,
    },
  };
}
