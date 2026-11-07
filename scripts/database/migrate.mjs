import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Client, loadConfig, connectConfig } from './common.mjs';
export async function migrate(client) {
  await client.query('begin');
  await client.query('select pg_advisory_xact_lock(883401)');
  try {
    await client.query('create schema if not exists accordly_private');
    await client.query('revoke all on schema accordly_private from public');
    await client.query(
      'create table if not exists accordly_private.schema_migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())',
    );
    for (const file of (await readdir(new URL('../../supabase/migrations/', import.meta.url)))
      .filter((f) => f.endsWith('.sql'))
      .sort()) {
      const sql = await readFile(
        new URL('../../supabase/migrations/' + file, import.meta.url),
        'utf8',
      );
      const checksum = createHash('sha256').update(sql).digest('hex');
      const old = await client.query(
        'select checksum from accordly_private.schema_migrations where version=$1',
        [file],
      );
      if (old.rowCount) {
        if (old.rows[0].checksum !== checksum)
          throw new Error('Applied migration checksum changed: ' + file);
        continue;
      }
      await client.query(sql);
      await client.query(
        'insert into accordly_private.schema_migrations(version,checksum) values($1,$2)',
        [file, checksum],
      );
      console.log('Prepared ' + file);
    }
    await client.query('commit');
    console.log('Migrations committed.');
  } catch (e) {
    await client.query('rollback');
    throw e;
  }
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadConfig();
  const client = new Client(connectConfig(process.env.DATABASE_URL));
  try {
    await client.connect();
    await migrate(client);
  } catch (e) {
    console.error('Migration failed:', e.code || '', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
