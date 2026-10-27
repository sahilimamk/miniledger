import { api } from './client';
import type { VerifyOtpResponse } from './types';

export interface RequestOtpResponse {
  ok: true;
  /** Present only when the server runs with DEMO_AUTH=true — or on old
      servers, which return the code unconditionally (no SMS there either). */
  code?: string;
  /** True when the server is in demo mode (no SMS provider). Absent on
      old servers; callers must key demo behavior on `code` presence, not
      on this flag, or old servers will look non-demo. */
  demo?: boolean;
}

/**
 * Asks the server to generate a sign-in code for this phone. The code is
 * returned ONLY when the server runs in demo mode; otherwise the caller
 * learns nothing but { demo: false } and must wait for the real channel.
 */
export async function requestOtp(phone: string): Promise<RequestOtpResponse> {
  return api.post<RequestOtpResponse>('/auth/request-otp', { phone });
}

/** Exchanges phone + code for a session token and the user record. */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>('/auth/verify-otp', { phone, code });
}
