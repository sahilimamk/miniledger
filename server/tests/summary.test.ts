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

function getSummary(token: string) {
  return request(app).get('/summary').set(authHeader(token));
}

describe('GET /summary', () => {
  it('all zeros for a user with no loans', async () => {
    const res = await getSummary(tokenA);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalLent: 0,
      totalRepaid: 0,
      outstanding: 0,
      overdueAmount: 0,
      counts: { total: 0, repaid: 0, pending: 0, overdue: 0 },
    });
  });

  it('exact totals across overdue, repaid, and future loans', async () => {
    // Overdue: 1000.00 lent, due 2 days ago, still pending.
    await createLoan(tokenA, {
      friendName: 'Overdue Ollie',
      amount: 1000,
      dueDate: dateOffset(-2),
    });
    // Repaid: 400.00 lent, repaid below.
    const repaid = (
      await createLoan(tokenA, {
        friendName: 'Repaid Rita',
        amount: 400,
        dueDate: dateOffset(10),
      })
    ).body;
    await request(app)
      .post(`/loans/${repaid.id}/repay`)
      .set(authHeader(tokenA));
    // Future pending: 250.50 lent, due in 10 days.
    await createLoan(tokenA, {
      friendName: 'Future Fred',
      amount: 250.5,
      dueDate: dateOffset(10),
    });

    const res = await getSummary(tokenA);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalLent: 1650.5,
      totalRepaid: 400,
      outstanding: 1250.5,
      overdueAmount: 1000,
      counts: { total: 3, repaid: 1, pending: 2, overdue: 1 },
    });
  });

  it('a repaid overdue loan no longer counts as overdue', async () => {
    const loan = (
      await createLoan(tokenA, {
        friendName: 'Late Larry',
        amount: 500,
        dueDate: dateOffset(-2),
      })
    ).body;
    await request(app)
      .post(`/loans/${loan.id}/repay`)
      .set(authHeader(tokenA));

    const res = await getSummary(tokenA);
    expect(res.body.totalRepaid).toBe(500);
    expect(res.body.outstanding).toBe(0);
    expect(res.body.overdueAmount).toBe(0);
    expect(res.body.counts).toEqual({
      total: 1,
      repaid: 1,
      pending: 0,
      overdue: 0,
    });
  });

  it('summary stays correct after an edit and a delete', async () => {
    const a = (
      await createLoan(tokenA, {
        friendName: 'A',
        amount: 100,
        dueDate: dateOffset(5),
      })
    ).body;
    const b = (
      await createLoan(tokenA, {
        friendName: 'B',
        amount: 200,
        dueDate: dateOffset(5),
      })
    ).body;
    await request(app)
      .patch(`/loans/${a.id}`)
      .set(authHeader(tokenA))
      .send({ amount: 150.25 });
    await request(app).delete(`/loans/${b.id}`).set(authHeader(tokenA));

    const res = await getSummary(tokenA);
    expect(res.body.totalLent).toBe(150.25);
    expect(res.body.outstanding).toBe(150.25);
    expect(res.body.counts.total).toBe(1);
  });

  it('is isolated per user', async () => {
    await createLoan(tokenA, {
      friendName: 'Only A',
      amount: 999,
      dueDate: dateOffset(-2),
    });
    const res = await getSummary(tokenB);
    expect(res.body.totalLent).toBe(0);
    expect(res.body.overdueAmount).toBe(0);
    expect(res.body.counts.total).toBe(0);
  });
});
