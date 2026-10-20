import { z } from 'zod';

const phoneSchema = z
  .string()
  .regex(/^\+?\d{10,15}$/, 'phone must be 10-15 digits, optional leading +');

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'code must be 6 digits'),
});
