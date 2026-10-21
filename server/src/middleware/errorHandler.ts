import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { HttpError } from '../utils/httpError';

/** Final error handler: every error leaves as { error: "<message>" }. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'file too large (max 5 MB)'
        : err.message;
    res.status(400).json({ error: message });
    return;
  }
  // body-parser failures carry a `type`; without this mapping they fell
  // through to a bare 500.
  const bodyType = (err as { type?: string } | null)?.type;
  if (bodyType === 'entity.too.large') {
    res.status(413).json({ error: 'request body too large' });
    return;
  }
  if (bodyType === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid JSON body' });
    return;
  }
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: 'invalid JSON body' });
    return;
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'internal server error' });
}
