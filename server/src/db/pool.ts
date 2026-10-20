import { Pool, types } from 'pg';
import { env } from '../config/env';

// Return DATE columns (OID 1082) as raw 'YYYY-MM-DD' strings instead of JS
// Dates, so due dates never drift across timezones.
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({ connectionString: env.databaseUrl });
