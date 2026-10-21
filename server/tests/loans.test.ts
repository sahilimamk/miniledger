import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import {
  app,
  setupTestDb,
  resetDb,
  closeDb,
  loginAs,
  authHeader,
  dateOffset,
} from './helpers';
import { pool } from '../src/db/pool';

const PHONE_A = '+919876543210';
const PHONE_B = '+919876543211';

let tokenA: string;
let tokenB: string;

beforeAll(setupTestDb);
beforeEach(async () => {
  await resetDb();
  tokenA = await loginAs(PHONE_A);
  tokenB = await loginAs(PHONE_B);
});
afterAll(closeDb);

function createLoan(token: string, body: Record<string, unknown>) {
  return request(app).post('/loans').set(authHeader(token)).send(body);
}

const validLoan = {
  friendName: 'Aman',
  amount: 250.5,
  dueDate: dateOffset(10),
  note: 'for books',
};

describe('POST /loans', () => {
  it('creates a loan: 201 with the exact contract shape', async () => {
    const res = await createLoan(tokenA, validLoan);
    expect(res.status).toBe(201);
    expect(res.body.friendName).toBe('Aman');
    expect(res.body.amount).toBe(250.5);
    expect(res.body.dueDate).toBe(validLoan.dueDate);
    expect(res.body.note).toBe('for books');
    expect(res.body.receiptUrl).toBeNull();
    expect(res.body.repaid).toBe(false);
    expect(res.body.repaidAt).toBeNull();
    expect(res.body.isOverdue).toBe(false);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof res.body.createdAt).toBe('string');
  });

  it('note is optional and defaults to null', async () => {
    const { note: _note, ...withoutNote } = validLoan;
    const res = await createLoan(tokenA, withoutNote);
    expect(res.status).toBe(201);
    expect(res.body.note).toBeNull();
  });

  it('persists amount as integer paise in the DB', async () => {
    const res = await createLoan(tokenA, validLoan);
    expect(res.status).toBe(201);
    const { rows } = await pool.query(
      'SELECT amount_cents, repaid_at, receipt_url FROM loans WHERE id = $1',
      [res.body.id],
    );
    expect(rows[0].amount_cents).toBe('25050');
    expect(rows[0].repaid_at).toBeNull();
    expect(rows[0].receipt_url).toBeNull();
  });

  it.each([
    ['zero amount', { amount: 0 }],
    ['negative amount', { amount: -50 }],
    ['three decimal places', { amount: 10.123 }],
    ['amount above the cap', { amount: 10_000_001 }],
    ['empty friendName', { friendName: '' }],
    ['whitespace-only friendName', { friendName: '   ' }],
    ['friendName over 80 chars', { friendName: 'x'.repeat(81) }],
    ['bad date format', { dueDate: '01/11/2026' }],
    ['impossible date', { dueDate: '2026-02-30' }],
    ['month out of range', { dueDate: '2026-13-01' }],
    ['missing amount', { amount: undefined }],
  ])('rejects %s with 400', async (_label, patch) => {
    const res = await createLoan(tokenA, { ...validLoan, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('flags a past-due pending loan as overdue', async () => {
    const res = await createLoan(tokenA, {
      ...validLoan,
      dueDate: dateOffset(-2),
    });
    expect(res.status).toBe(201);
    expect(res.body.isOverdue).toBe(true);
  });

  it('requires auth: no token -> 401', async () => {
    const res = await request(app).post('/loans').send(validLoan);
    expect(res.status).toBe(401);
  });
});

describe('GET /loans', () => {
  it('lists only the caller\'s loans, newest first', async () => {
    await createLoan(tokenA, { ...validLoan, friendName: 'First' });
    await createLoan(tokenA, { ...validLoan, friendName: 'Second' });
    await createLoan(tokenB, { ...validLoan, friendName: 'NotYours' });

    const res = await request(app).get('/loans').set(authHeader(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.loans).toHaveLength(2);
    expect(res.body.loans.map((l: { friendName: string }) => l.friendName)).toEqual([
      'Second',
      'First',
    ]);
  });

  it('empty list for a fresh user', async () => {
    const res = await request(app).get('/loans').set(authHeader(tokenA));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ loans: [] });
  });
});

describe('GET /loans/:id', () => {
  it('returns the loan', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .get(`/loans/${created.id}`)
      .set(authHeader(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
  });

  it('404 for a nonexistent id', async () => {
    const res = await request(app)
      .get('/loans/00000000-0000-0000-0000-000000000000')
      .set(authHeader(tokenA));
    expect(res.status).toBe(404);
  });

  it('404 (not 500) for a malformed id', async () => {
    const res = await request(app)
      .get('/loans/not-a-uuid')
      .set(authHeader(tokenA));
    expect(res.status).toBe(404);
  });

  it('cross-user: user B cannot see user A\'s loan', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .get(`/loans/${created.id}`)
      .set(authHeader(tokenB));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /loans/:id', () => {
  it('updates fields and returns the updated loan', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .patch(`/loans/${created.id}`)
      .set(authHeader(tokenA))
      .send({ friendName: 'Aman Gupta', amount: 300.75, note: null });
    expect(res.status).toBe(200);
    expect(res.body.friendName).toBe('Aman Gupta');
    expect(res.body.amount).toBe(300.75);
    expect(res.body.note).toBeNull();
  });

  it('rejects an invalid patch with 400', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .patch(`/loans/${created.id}`)
      .set(authHeader(tokenA))
      .send({ amount: -1 });
    expect(res.status).toBe(400);
  });

  it('cross-user: user B cannot patch user A\'s loan', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .patch(`/loans/${created.id}`)
      .set(authHeader(tokenB))
      .send({ friendName: 'Hijack' });
    expect(res.status).toBe(404);
  });
});

describe('POST /loans/:id/repay', () => {
  it('marks the loan repaid with a timestamp', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .post(`/loans/${created.id}/repay`)
      .set(authHeader(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.repaid).toBe(true);
    expect(typeof res.body.repaidAt).toBe('string');
    expect(res.body.isOverdue).toBe(false);
  });

  it('repaying an overdue loan clears the overdue flag', async () => {
    const created = (
      await createLoan(tokenA, { ...validLoan, dueDate: dateOffset(-2) })
    ).body;
    expect(created.isOverdue).toBe(true);
    const res = await request(app)
      .post(`/loans/${created.id}/repay`)
      .set(authHeader(tokenA));
    expect(res.body.repaid).toBe(true);
    expect(res.body.isOverdue).toBe(false);
  });

  it('double repay -> 409', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const first = await request(app)
      .post(`/loans/${created.id}/repay`)
      .set(authHeader(tokenA));
    expect(first.status).toBe(200);
    const second = await request(app)
      .post(`/loans/${created.id}/repay`)
      .set(authHeader(tokenA));
    expect(second.status).toBe(409);
    expect(second.body.error).toBeTruthy();
  });

  it('cross-user: user B cannot repay user A\'s loan', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .post(`/loans/${created.id}/repay`)
      .set(authHeader(tokenB));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /loans/:id', () => {
  it('deletes with 204 and the loan is gone', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const del = await request(app)
      .delete(`/loans/${created.id}`)
      .set(authHeader(tokenA));
    expect(del.status).toBe(204);
    const get = await request(app)
      .get(`/loans/${created.id}`)
      .set(authHeader(tokenA));
    expect(get.status).toBe(404);
  });

  it('deleting twice -> second is 404', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    await request(app).delete(`/loans/${created.id}`).set(authHeader(tokenA));
    const res = await request(app)
      .delete(`/loans/${created.id}`)
      .set(authHeader(tokenA));
    expect(res.status).toBe(404);
  });

  it('cross-user: user B cannot delete user A\'s loan', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .delete(`/loans/${created.id}`)
      .set(authHeader(tokenB));
    expect(res.status).toBe(404);
    const get = await request(app)
      .get(`/loans/${created.id}`)
      .set(authHeader(tokenA));
    expect(get.status).toBe(200);
  });
});

describe('POST /loans/:id/receipt', () => {
  // 1x1 transparent PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

  it('uploads an image and stores receiptUrl; file is served', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .post(`/loans/${created.id}/receipt`)
      .set(authHeader(tokenA))
      .attach('receipt', png, 'receipt.png');
    expect(res.status).toBe(200);
    expect(res.body.receiptUrl).toMatch(/^\/uploads\/.+\.png$/);

    const file = await request(app).get(res.body.receiptUrl);
    expect(file.status).toBe(200);
  });

  it('rejects a non-image upload with 400', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .post(`/loans/${created.id}/receipt`)
      .set(authHeader(tokenA))
      .attach('receipt', Buffer.from('plain text'), 'note.txt');
    expect(res.status).toBe(400);
  });

  it('cross-user: user B cannot attach a receipt to user A\'s loan', async () => {
    const created = (await createLoan(tokenA, validLoan)).body;
    const res = await request(app)
      .post(`/loans/${created.id}/receipt`)
      .set(authHeader(tokenB))
      .attach('receipt', png, 'receipt.png');
    expect(res.status).toBe(404);
  });
});

describe('friendPhone (v8 reminders)', () => {
  it('creates a loan with a friend phone and returns it', async () => {
    const res = await createLoan(tokenA, { ...validLoan, friendPhone: '+91 98100 12345' });
    expect(res.status).toBe(201);
    expect(res.body.friendPhone).toBe('+919810012345');
  });

  it('defaults friendPhone to null when not provided', async () => {
    const res = await createLoan(tokenA, validLoan);
    expect(res.status).toBe(201);
    expect(res.body.friendPhone).toBeNull();
  });

  it('rejects a junk friend phone with 400', async () => {
    const res = await createLoan(tokenA, { ...validLoan, friendPhone: 'call-me-maybe' });
    expect(res.status).toBe(400);
  });

  it('PATCH sets and then clears the friend phone', async () => {
    const created = await createLoan(tokenA, validLoan);
    const id = created.body.id as string;

    const set = await request(app)
      .patch(`/loans/${id}`)
      .set(authHeader(tokenA))
      .send({ friendPhone: '9810012345' });
    expect(set.status).toBe(200);
    expect(set.body.friendPhone).toBe('9810012345');

    const cleared = await request(app)
      .patch(`/loans/${id}`)
      .set(authHeader(tokenA))
      .send({ friendPhone: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.friendPhone).toBeNull();
  });
});
