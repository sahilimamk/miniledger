import { createApp } from './app';
import { env, DEFAULT_JWT_SECRET } from './config/env';
import { migrate } from './db/migrate';

/** Entry point only: guard the JWT secret, run migrations, then listen. */
async function main(): Promise<void> {
  // The built-in secret is public knowledge (it is in the source tree), so a
  // token signed with it proves nothing. Production must bring its own.
  if (env.jwtSecret === DEFAULT_JWT_SECRET) {
    if (env.nodeEnv === 'production') {
      console.error(
        '[miniledger] FATAL: JWT_SECRET is the built-in dev default. ' +
          'Set a real JWT_SECRET before running in production. Refusing to start.',
      );
      process.exit(1);
    }
    console.warn(
      '[miniledger] WARNING: JWT_SECRET is the built-in dev default — anyone can forge tokens. Set JWT_SECRET before deploying.',
    );
  }
  await migrate();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(
      `[miniledger] server listening on http://localhost:${env.port}`,
    );
  });
}

main().catch((err) => {
  console.error('[miniledger] failed to start', err);
  process.exit(1);
});
