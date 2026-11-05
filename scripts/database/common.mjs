import { existsSync } from 'node:fs';
import pg from 'pg';
export function loadConfig() {
  if (existsSync('apps/dashboard/.env.local')) process.loadEnvFile('apps/dashboard/.env.local');
}
export function connectConfig(url) {
  if (!url) throw new Error('Database connection variable is missing');
  const parsed = new URL(url);
  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  // Keep remote TLS validation enabled; reject URL options that weaken it.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert'])
    parsed.searchParams.delete(key);
  return {
    connectionString: parsed.toString(),
    ssl: local
      ? false
      : { rejectUnauthorized: true, ca: process.env.SUPABASE_CA_CERT?.replace(/\\n/g, '\n') },
    connectionTimeoutMillis: 10000,
  };
}
export const Client = pg.Client;
