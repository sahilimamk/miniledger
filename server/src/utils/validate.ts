import { z } from 'zod';
import { HttpError } from './httpError';

/** Validate a request body with zod; first violation -> 400 { error }. */
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(
      400,
      result.error.issues[0]?.message ?? 'invalid request body',
    );
  }
  return result.data;
}
