import { api } from './client';
import type { VerifyOtpResponse } from './types';

/**
 * Normalized OTP-request result. The strict demo rule, enforced here so no
 * screen can get it wrong: a sign-in code is exposed to the UI ONLY when
 * the server explicitly says it is operating in demo mode (`demo: true`).
 * A response that merely contains a `code` — e.g. a legacy server that
 * returns the code unconditionally with no demo flag — is NOT proof of
 * demo mode, so its code is discarded here, never stored, rendered, or
 * logged. When demo is off, the caller learns nothing but `demo: false`
 * and must wait for the real channel (an SMS provider, once wired).
 */
export interface RequestOtpResponse {
  ok: true;
  /** True only when the server explicitly runs with DEMO_AUTH=true. */
  demo: boolean;
  /** Present only when `demo` is true. Never present otherwise. */
  code?: string;
}

interface RawRequestOtpResponse {
  ok: true;
  code?: string;
  demo?: boolean;
}

/**
 * Asks the server to generate a sign-in code for this phone, then applies
 * the strict demo rule: the code survives only if the server explicitly
 * declared demo mode. Anything else — including a legacy `{ code }` with
 * no flag — comes back as `{ demo: false }` with the code dropped.
 */
export async function requestOtp(phone: string): Promise<RequestOtpResponse> {
  const res = await api.post<RawRequestOtpResponse>('/auth/request-otp', { phone });
  const demo = res.demo === true;
  return { ok: true, demo, code: demo ? res.code : undefined };
}

/** Exchanges phone + code for a session token and the user record. */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>('/auth/verify-otp', { phone, code });
}
