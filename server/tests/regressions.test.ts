import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
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
import { UPLOADS_DIR } from '../src/middleware/upload';
import { peekOtp } from '../src/modules/auth/auth.service';

/**
 * Regression tests for the QA defect-fix iteration (BUG-1..BUG-7).
 * Each describe names the defect it pins down.
 */

const PHONE = '+919876543210';
// vitest.config.ts pins JWT_SECRET for the suite.
const TEST_SECRET = 'test-secret';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

let token: string;
// Files that existed before this suite ran; anything else is ours to clean.
let preexistingFiles: Set<string>;

beforeAll(async () => {
  await setupTestDb();
  preexistingFiles = new Set(fs.readdirSync(UPLOADS_DIR));
});
beforeEach(async () => {
  await resetDb();
  token = await loginAs(PHONE);
});
afterAll(async () => {
  for (const name of fs.readdirSync(UPLOADS_DIR)) {
    if (!preexistingFiles.has(name)) {
      fs.unlinkSync(path.join(UPLOADS_DIR, name));
    }
  }
  await closeDb();
});

function createLoan(body: Record<string, unknown>) {
  return request(app).post('/loans').set(authHeader(token)).send(body);
}

const validLoan = { friendName: 'Aman', amount: 100, dueDate: dateOffset(10) };

describe('BUG-1: token for a nonexistent user must not authenticate', () => {
  function forgedToken(): string {
    // Correctly signed with the server's secret, but the subject is a user
    // that does not exist — the old middleware let this straight through.
    return jwt.sign({}, TEST_SECRET, {
      subject: crypto.randomUUID(),
      expiresIn: '1h',
      algorithm: 'HS256',
    });
  }

  it('GET /loans with a nonexistent-user token -> 401, not 200/500', async () => {
    const res = await request(app)
      .get('/loans')
      .set(authHeader(forgedToken()));
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('POST /loans with a nonexistent-user token -> 401, not a 500 FK violation', async () => {
    const res = await request(app)
      .post('/loans')
      .set(authHeader(forgedToken()))
      .send(validLoan);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('a token whose user was deleted after issuing -> 401', async () => {
    await pool.query('DELETE FROM users WHERE phone = $1', [PHONE]);
    const res = await request(app).get('/loans').set(authHeader(token));
    expect(res.status).toBe(401);
  });
});

describe('BUG-2: receipt upload validates content, not declared type', () => {
  it('HTML disguised as an image -> 400 and nothing is stored', async () => {
    const created = (await createLoan(validLoan)).body;
    const before = fs.readdirSync(UPLOADS_DIR);
    const res = await request(app)
      .post(`/loans/${created.id}/receipt`)
      .set(authHeader(token))
      .attach('receipt', Buffer.from('<html><script>alert(1)</script></html>'), {
        filename: 'evil.html',
        contentType: 'image/png',
      });
    expect(res.status).toBe(400);
    expect(fs.readdirSync(UPLOADS_DIR)).toEqual(before);
  });

  it('SVG upload -> 400 (executable markup is not an image)', async () => {
    const created = (await createLoan(validLoan)).body;
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    const res = await request(app)
      .post(`/loans/${created.id}/receipt`)
      .set(authHeader(token))
      .attach('receipt', svg, { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(400);
  });

  it('a valid PNG is stored under a .png name and served with nosniff', async () => {
    const created = (await createLoan(validLoan)).body;
    const res = await request(app)
      .post(`/loans/${created.id}/receipt`)
      .set(authHeader(token))
      // Even with a misleading user filename, the stored name comes from
      // the sniffed type.
      .attach('receipt', png, { filename: 'photo.whatever', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.receiptUrl).toMatch(/^\/uploads\/.+\.png$/);
    expect(
      fs.existsSync(path.join(UPLOADS_DIR, path.basename(res.body.receiptUrl))),
    ).toBe(true);

    const served = await request(app).get(res.body.receiptUrl);
    expect(served.status).toBe(200);
    expect(served.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('BUG-3: OTP guessing and request flooding are capped', () => {
  const ATTEMPT_PHONE = '+919999999901';
  const FLOOD_PHONE = '+919999999902';

  it('5 wrong attempts burn the code: the correct code then gets 401', async () => {
    await request(app).post('/auth/request-otp').send({ phone: ATTEMPT_PHONE });
    const correct = peekOtp(ATTEMPT_PHONE)!;
    // '000000' can never be issued (codes are 100000-999999).
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ phone: ATTEMPT_PHONE, code: '000000' });
      expect(res.status).toBe(401);
    }
    const sixth = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: ATTEMPT_PHONE, code: correct });
    expect(sixth.status).toBe(401);
  });

  it('more than 5 OTP requests per phone in the window -> 429', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/auth/request-otp')
        .send({ phone: FLOOD_PHONE });
      expect(res.status).toBe(200);
    }
    const sixth = await request(app)
      .post('/auth/request-otp')
      .send({ phone: FLOOD_PHONE });
    expect(sixth.status).toBe(429);
    expect(sixth.body).toEqual({ error: 'too many otp requests' });
  });
});

describe('BUG-4: sub-paise amounts are a 400, not a DB 500', () => {
  it('POST /loans with amount 1e-9 -> 400', async () => {
    const res = await createLoan({ ...validLoan, amount: 1e-9 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('PATCH /loans/:id with amount 1e-9 -> 400', async () => {
    const created = (await createLoan(validLoan)).body;
    const res = await request(app)
      .patch(`/loans/${created.id}`)
      .set(authHeader(token))
      .send({ amount: 1e-9 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe('BUG-5: oversized JSON body -> 413, not 500', () => {
  it('a 200 KB note exceeds the body limit -> 413', async () => {
    const res = await createLoan({
      ...validLoan,
      note: 'x'.repeat(200 * 1024),
    });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'request body too large' });
  });
});

describe('BUG-6: receipt files are not orphaned', () => {
  async function uploadReceipt(loanId: string): Promise<string> {
    const res = await request(app)
      .post(`/loans/${loanId}/receipt`)
      .set(authHeader(token))
      .attach('receipt', png, 'receipt.png');
    expect(res.status).toBe(200);
    return path.basename(res.body.receiptUrl as string);
  }

  it('replacing a receipt leaves exactly one file behind', async () => {
    // Snapshot at test start: earlier tests in this file may have left
    // receipt files of their own (DB resets do not touch the disk).
    const beforeTest = new Set(fs.readdirSync(UPLOADS_DIR));
    const created = (await createLoan(validLoan)).body;
    const first = await uploadReceipt(created.id);
    const second = await uploadReceipt(created.id);
    expect(second).not.toBe(first);
    expect(fs.existsSync(path.join(UPLOADS_DIR, first))).toBe(false);
    expect(fs.existsSync(path.join(UPLOADS_DIR, second))).toBe(true);
    const mine = fs
      .readdirSync(UPLOADS_DIR)
      .filter((f) => !beforeTest.has(f));
    expect(mine).toEqual([second]);
  });

  it('deleting a loan removes its receipt file', async () => {
    const created = (await createLoan(validLoan)).body;
    const name = await uploadReceipt(created.id);
    const filePath = path.join(UPLOADS_DIR, name);
    expect(fs.existsSync(filePath)).toBe(true);
    const del = await request(app)
      .delete(`/loans/${created.id}`)
      .set(authHeader(token));
    expect(del.status).toBe(204);
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

describe('BUG-7: years below 100 round-trip in dueDate validation', () => {
  it('dueDate 0001-01-01 is accepted -> 201', async () => {
    const res = await createLoan({ ...validLoan, dueDate: '0001-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.dueDate).toBe('0001-01-01');
  });

  it('impossible dates stay rejected: 2026-02-30 -> 400', async () => {
    const res = await createLoan({ ...validLoan, dueDate: '2026-02-30' });
    expect(res.status).toBe(400);
  });
});

describe('CORS (web app support)', () => {
  it('answers a preflight request with allow headers', async () => {
    const res = await request(app)
      .options('/loans')
      .set('Origin', 'http://localhost:8082')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8082');
    expect(res.headers['access-control-allow-headers']).toContain('Authorization');
  });

  it('stamps the allow-origin header on real responses', async () => {
    const token = await loginAs('+919200000001');
    const res = await request(app)
      .get('/summary')
      .set('Origin', 'http://localhost:8082')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8082');
  });
});
