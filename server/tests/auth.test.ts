import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import {
  app,
  setupTestDb,
  resetDb,
  closeDb,
  loginAs,
  authHeader,
} from './helpers';
import { peekOtp, expireOtpForTest } from '../src/modules/auth/auth.service';

const PHONE = '+919876543210';

beforeAll(setupTestDb);
beforeEach(resetDb);
afterAll(closeDb);

describe('POST /auth/request-otp', () => {
  it('returns 200 { ok: true, demo: false } and NO code when demo is off (default)', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: PHONE });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.demo).toBe(false);
    expect(res.body.code).toBeUndefined();
    expect(peekOtp(PHONE)).toMatch(/^\d{6}$/);
  });

  it('returns the code only when DEMO_AUTH=true', async () => {
    process.env.DEMO_AUTH = 'true';
    try {
      const res = await request(app)
        .post('/auth/request-otp')
        .send({ phone: PHONE });
      expect(res.status).toBe(200);
      expect(res.body.demo).toBe(true);
      expect(res.body.code).toMatch(/^\d{6}$/);
    } finally {
      delete process.env.DEMO_AUTH;
    }
  });

  it('never logs the code when demo is off; logs it when demo is on', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await request(app).post('/auth/request-otp').send({ phone: PHONE });
      expect(
        spy.mock.calls.some((args) => String(args[0]).includes('[OTP]')),
      ).toBe(false);
      process.env.DEMO_AUTH = 'true';
      try {
        await request(app).post('/auth/request-otp').send({ phone: PHONE });
      } finally {
        delete process.env.DEMO_AUTH;
      }
      expect(
        spy.mock.calls.some((args) => String(args[0]).includes('[OTP]')),
      ).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('accepts a bare 10-digit phone without +', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: '9876543210' });
    expect(res.status).toBe(200);
  });

  it('rejects an invalid phone with 400', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects a missing phone with 400', async () => {
    const res = await request(app).post('/auth/request-otp').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/verify-otp', () => {
  it('happy path: returns token and user, creating the user row', async () => {
    await request(app).post('/auth/request-otp').send({ phone: PHONE });
    const code = peekOtp(PHONE)!;
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.phone).toBe(PHONE);
    expect(res.body.user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('second login for the same phone returns the same user id', async () => {
    const first = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code: await freshCode(PHONE) });
    const second = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code: await freshCode(PHONE) });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('wrong code -> 401 invalid code', async () => {
    await request(app).post('/auth/request-otp').send({ phone: PHONE });
    // '000000' can never be issued: codes are generated in [100000, 999999].
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code: '000000' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid code');
  });

  it('no OTP requested -> 401', async () => {
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code: '123456' });
    expect(res.status).toBe(401);
  });

  it('a consumed code cannot be reused -> 401', async () => {
    const code = await freshCode(PHONE);
    const first = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code });
    expect(first.status).toBe(200);
    const second = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code });
    expect(second.status).toBe(401);
  });

  it('an expired code -> 401 code expired', async () => {
    const code = await freshCode(PHONE);
    expireOtpForTest(PHONE);
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: PHONE, code });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('code expired');
  });
});

describe('protected routes', () => {
  it('missing token -> 401 { error: "unauthorized" }', async () => {
    const res = await request(app).get('/loans');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('garbage token -> 401', async () => {
    const res = await request(app)
      .get('/loans')
      .set(authHeader('not-a-real-token'));
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('valid token reaches /summary', async () => {
    const token = await loginAs(PHONE);
    const res = await request(app).get('/summary').set(authHeader(token));
    expect(res.status).toBe(200);
  });
});

async function freshCode(phone: string): Promise<string> {
  await request(app).post('/auth/request-otp').send({ phone });
  const code = peekOtp(phone);
  if (!code) throw new Error('OTP not stored');
  return code;
}
