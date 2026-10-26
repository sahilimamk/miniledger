import fs from 'fs';
import path from 'path';

// Minimal .env loader (no extra dependency): reads server/.env when present.
// Values already in process.env always win.
function loadDotEnv(): void {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

/** Built-in dev-only fallback. Never acceptable in production (see index.ts). */
export const DEFAULT_JWT_SECRET = 'dev-only-secret-change-me';

export const env = {
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/miniledger',
  port: Number(process.env.PORT ?? 4000),
  // Dev-only default; set JWT_SECRET in any real deployment.
  jwtSecret: process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
  nodeEnv: process.env.NODE_ENV ?? 'development',
};

/**
 * Demo auth gate. When true, /request-otp returns the code in the response
 * and the server logs it, so the client can show it on screen — the current
 * deployment has no SMS provider, so this is the only sign-in path there.
 * When false (the default), the code is NEVER returned, logged, or rendered:
 * the client only learns a code was requested. Read per call so tests and
 * process restarts pick up changes without a rebuild.
 */
export function isDemoAuth(): boolean {
  return process.env.DEMO_AUTH === 'true';
}
