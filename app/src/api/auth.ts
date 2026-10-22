import { api } from './client';
import type { VerifyOtpResponse } from './types';

/** Asks the server to generate a mock OTP for this phone (printed in the server log). */
export async function requestOtp(phone: string): Promise<void> {
  await api.post<{ ok: true }>('/auth/request-otp', { phone });
}

/** Exchanges phone + code for a session token and the user record. */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>('/auth/verify-otp', { phone, code });
}
