import request from 'supertest';
import { createApp } from '../src/app';
import { migrate } from '../src/db/migrate';
import { pool } from '../src/db/pool';
import { peekOtp } from '../src/modules/auth/auth.service';

export const app = createApp();

/** Run migrations against the test DB, then wipe all data. */
export async function setupTestDb(): Promise<void> {
  await migrate();
  await resetDb();
}

export async function resetDb(): Promise<void> {
  await pool.query('TRUNCATE loans, users RESTART IDENTITY CASCADE');
}

export async function closeDb(): Promise<void> {
  await pool.end();
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/** Full OTP login flow against the in-memory store; returns a JWT. */
export async function loginAs(phone: string): Promise<string> {
  const reqRes = await request(app).post('/auth/request-otp').send({ phone });
  if (reqRes.status !== 200) {
    throw new Error(`request-otp failed: ${reqRes.status} ${JSON.stringify(reqRes.body)}`);
  }
  const code = peekOtp(phone);
  if (!code) throw new Error(`no OTP stored for ${phone}`);
  const verifyRes = await request(app)
    .post('/auth/verify-otp')
    .send({ phone, code });
  if (verifyRes.status !== 200) {
    throw new Error(`verify-otp failed: ${verifyRes.status} ${JSON.stringify(verifyRes.body)}`);
  }
  return verifyRes.body.token as string;
}

/** 'YYYY-MM-DD' for a date offset from today (server-local). */
export function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
