import fs from 'fs';
import path from 'path';
import { pool } from './pool';

// Migrations live in server/migrations/ — OUTSIDE src/ — so one relative
// path resolves identically in both run modes:
//   tsx:  src/db/migrate.ts   -> ../../migrations = server/migrations
//   tsc:  dist/db/migrate.js  -> ../../migrations = server/migrations
// Applied files are tracked in the schema_migrations table; each pending
// file runs once, in filename order, inside a transaction.
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [file],
    );
    if (rows.length > 0) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        file,
      ]);
      await client.query('COMMIT');
      console.log(`[migrate] applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .then(() => console.log('[migrate] done'))
    .catch((err) => {
      console.error('[migrate] failed', err);
      process.exit(1);
    });
}
