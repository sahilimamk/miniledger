import { HttpError } from './httpError';

/**
 * The single rupees <-> paise conversion point for the server.
 * The API speaks decimal rupees (JSON numbers); the DB stores integer paise.
 */

/** Convert decimal rupees to integer paise. Rejects > 2 decimal places. */
export function rupeesToPaise(amount: number): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new HttpError(400, 'amount must be a number');
  }
  const scaled = amount * 100;
  const paise = Math.round(scaled);
  // Epsilon comparison: 250.5 * 100 is 25050.000000000004 in floating point,
  // a true 3-decimal value like 10.123 is ~0.3 away from the nearest paise.
  if (Math.abs(scaled - paise) > 1e-6) {
    throw new HttpError(400, 'amount must have at most 2 decimal places');
  }
  // Sub-paise inputs like 1e-9 round to 0 paise; the DB CHECK (amount_cents
  // > 0) would turn that into a 500. Reject here as the client error it is.
  if (paise < 1) {
    throw new HttpError(400, 'amount must be at least 0.01');
  }
  return paise;
}

/** Convert integer paise (pg returns BIGINT as string) to decimal rupees. */
export function paiseToRupees(paise: number | string | bigint): number {
  return Number(paise) / 100;
}
