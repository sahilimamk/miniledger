import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests always run against the dedicated test database.
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        'postgres://postgres:postgres@localhost:5432/miniledger_test',
      JWT_SECRET: 'test-secret',
      NODE_ENV: 'test',
    },
    // Test files share one database, so run them sequentially to keep
    // TRUNCATE-based resets from racing each other.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
