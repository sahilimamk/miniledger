import express from 'express';
import { cors } from './middleware/cors';
import { authRouter } from './modules/auth/auth.routes';
import { loansRouter } from './modules/loans/loans.routes';
import { summaryRouter } from './modules/summary/summary.routes';
import { UPLOADS_DIR } from './middleware/upload';
import { errorHandler } from './middleware/errorHandler';

/** Express assembly only: parsing, static uploads, routes, errors last. */
export function createApp() {
  const app = express();
  app.use(cors);
  app.use(express.json());
  // nosniff: a stored file must never be reinterpreted as HTML/JS by a
  // browser, whatever its bytes claim to be.
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );
  // Public health check — used by Render and docker-compose healthcheck.
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use('/loans', loansRouter);
  app.use('/summary', summaryRouter);
  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });
  app.use(errorHandler);
  return app;
}
