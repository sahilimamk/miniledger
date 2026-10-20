import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { HttpError } from '../utils/httpError';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Verifies `Authorization: Bearer <jwt>` AND that the token's user still
 * exists; sets req.userId. 401 otherwise — a well-formed token naming a
 * deleted or never-existent user must never reach a route (it used to sail
 * through and explode as a 500 FK violation on writes).
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new HttpError(401, 'unauthorized'));
    return;
  }

  let userId: string;
  try {
    const payload = jwt.verify(header.slice('Bearer '.length), env.jwtSecret, {
      algorithms: ['HS256'],
    }) as { sub?: string };
    if (!payload.sub) throw new Error('missing subject');
    userId = payload.sub;
  } catch {
    next(new HttpError(401, 'unauthorized'));
    return;
  }

  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [
      userId,
    ]);
    if (!rows[0]) {
      next(new HttpError(401, 'unauthorized'));
      return;
    }
  } catch (err) {
    // 22P02 = the subject was not even a uuid; that is a bad token, not a 500.
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: string }).code === '22P02'
    ) {
      next(new HttpError(401, 'unauthorized'));
      return;
    }
    next(err);
    return;
  }

  req.userId = userId;
  next();
}
