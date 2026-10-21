import type { RequestHandler } from 'express';

/**
 * CORS for the web build of the app. The browser enforces CORS, native apps
 * do not — without this, the web app cannot call the API at all.
 *
 * Dev behaviour: reflect whatever Origin the browser sends (the API is
 * protected by Bearer tokens, not cookies, so reflection is safe here).
 * For a public deployment, replace the reflection with an allowlist of
 * known web origins.
 */
export const cors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
};
