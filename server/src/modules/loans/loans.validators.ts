import { z } from 'zod';

const friendNameSchema = z
  .string()
  .trim()
  .min(1, 'friendName must not be empty')
  .max(80, 'friendName must be at most 80 characters');

const amountSchema = z
  .number({ invalid_type_error: 'amount must be a number' })
  .positive('amount must be greater than 0')
  .max(10_000_000, 'amount must be at most 10000000')
  .refine((v) => {
    // Must convert to a positive integer number of paise: 1e-9 is "positive"
    // and within epsilon of 0 paise, yet is not a payable amount.
    const paise = Math.round(v * 100);
    return paise >= 1 && Math.abs(v * 100 - paise) < 1e-6;
  }, 'amount must be at least 0.01 with at most 2 decimal places');

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD')
  .refine((v) => {
    const [y, m, d] = v.split('-').map(Number);
    // NOT Date.UTC(y, ...): it maps years 0–99 to 1900–1999, so the
    // round-trip check falsely rejected valid dates like 0001-01-01.
    // setUTCFullYear sets the literal year.
    const date = new Date(0);
    date.setUTCFullYear(y, m - 1, d);
    return (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    );
  }, 'dueDate must be a valid date');

// Friend phone for reminders: same shape as a login phone — 10-15 digits,
// optional leading +. Spaces/dashes are stripped before the check.
const friendPhoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => /^\+?\d{10,15}$/.test(v), 'friendPhone must be 10-15 digits, optional leading +');

export const createLoanSchema = z.object({
  friendName: friendNameSchema,
  amount: amountSchema,
  dueDate: dueDateSchema,
  note: z.string().optional(),
  friendPhone: friendPhoneSchema.optional(),
});

export const patchLoanSchema = z.object({
  friendName: friendNameSchema.optional(),
  amount: amountSchema.optional(),
  dueDate: dueDateSchema.optional(),
  note: z.string().nullable().optional(),
  friendPhone: friendPhoneSchema.nullable().optional(),
});
