import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { HttpError } from '../../utils/httpError';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

// Mock OTP store: in-memory only, 5-minute expiry. Codes are printed to the
// server log (no SMS in this build).
const otpStore = new Map<string, OtpRecord>();
const OTP_TTL_MS = 5 * 60 * 1000;

// Brute-force / flooding limits. After MAX_VERIFY_ATTEMPTS wrong guesses an
// issued code is destroyed — even the correct code is then rejected.
const MAX_VERIFY_ATTEMPTS = 5;
// At most MAX_OTP_REQUESTS code requests per phone per window. A successful
// verify clears the phone's request history: the cap exists to stop
// unauthenticated request flooding, and a completed verify is proof the
// requester holds the phone.
const MAX_OTP_REQUESTS = 5;
const OTP_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const otpRequestLog = new Map<string, number[]>();

export function requestOtp(phone: string): string {
  const now = Date.now();
  const recent = (otpRequestLog.get(phone) ?? []).filter(
    (t) => now - t < OTP_REQUEST_WINDOW_MS,
  );
  if (recent.length >= MAX_OTP_REQUESTS) {
    otpRequestLog.set(phone, recent);
    throw new HttpError(429, 'too many otp requests');
  }
  recent.push(now);
  otpRequestLog.set(phone, recent);

  const code = String(crypto.randomInt(100000, 1000000));
  // A fresh request supersedes any previous code and resets its guess count.
  otpStore.set(phone, { code, expiresAt: now + OTP_TTL_MS, attempts: 0 });
  console.log(`[OTP] phone=${phone} code=${code}`);
  return code;
}

export interface AuthResult {
  token: string;
  user: { id: string; phone: string };
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<AuthResult> {
  const record = otpStore.get(phone);
  if (!record || record.expiresAt < Date.now()) {
    if (record) otpStore.delete(phone);
    throw new HttpError(401, 'invalid or expired code');
  }
  if (record.code !== code) {
    record.attempts += 1;
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      // Too many guesses: burn the code so further attempts — including one
      // with the correct code — are rejected.
      otpStore.delete(phone);
    }
    throw new HttpError(401, 'invalid or expired code');
  }
  otpStore.delete(phone);
  otpRequestLog.delete(phone);

  // User row is created on first successful verify.
  const { rows } = await pool.query<{ id: string; phone: string }>(
    `INSERT INTO users (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id, phone`,
    [phone],
  );
  const user = rows[0];
  const token = jwt.sign({}, env.jwtSecret, {
    subject: user.id,
    expiresIn: '7d',
    algorithm: 'HS256',
  });
  return { token, user: { id: user.id, phone: user.phone } };
}

/** Test hook: lets the suite complete the OTP flow without scraping logs. */
export function peekOtp(phone: string): string | undefined {
  return otpStore.get(phone)?.code;
}
