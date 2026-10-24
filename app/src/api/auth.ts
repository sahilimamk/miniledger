import { api } from './client';
import type { VerifyOtpResponse } from './types';

/** Asks the server to generate a mock OTP for this phone. Returns the code directly (demo build — no SMS). */
export async function requestOtp(phone: string): Promise<string> {
  const res = await api.post<{ ok: true; code: string }>('/auth/request-otp', { phone });
  return res.code;
}

/** Exchanges phone + code for a session token and the user record. */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>('/auth/verify-otp', { phone, code });
}
