import 'server-only';
import { Pool, type PoolClient } from 'pg';
import type { Actor } from './auth';
let pool: Pool | undefined;
function getPool() {
  if (!pool) {
    const value = process.env.ACCORDLY_DATABASE_URL;
    if (!value)
      throw new Error(
        'ACCORDLY_DATABASE_URL is not configured. Run the database migrations and provision the runtime role.',
      );
    const url = new URL(value);
    for (const k of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(k);
    pool = new Pool({
      connectionString: url.toString(),
      ssl: ['localhost', '127.0.0.1'].includes(url.hostname)
        ? false
        : { rejectUnauthorized: true, ca: process.env.SUPABASE_CA_CERT?.replace(/\\n/g, '\n') },
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}
export async function withDatabase<T>(work: (db: PoolClient) => Promise<T>) {
  const db = await getPool().connect();
  try {
    const result = await db.query(
      'select current_user as name,rolsuper,rolbypassrls from pg_roles where rolname=current_user',
    );
    const role = result.rows[0];
    if (role.name !== 'accordly_app' || role.rolsuper || role.rolbypassrls)
      throw new Error('The application requires the restricted accordly_app database role.');
    return await work(db);
  } finally {
    db.release();
  }
}
export async function withTenant<T>(actor: Actor, work: (db: PoolClient) => Promise<T>) {
  return withDatabase(async (db) => {
    await db.query('begin');
    try {
      await db.query(
        "select set_config('accordly.org_id',$1,true),set_config('accordly.user_id',$2,true),set_config('accordly.role',$3,true)",
        [actor.orgId, actor.userId, actor.role],
      );
      await db.query(
        'insert into accordly.organizations(id,name) values($1,$2) on conflict do nothing',
        [actor.orgId, actor.orgName],
      );
      await db.query(
        'insert into accordly.memberships(organization_id,user_id,role) values($1,$2,$3) on conflict(organization_id,user_id) do update set role=excluded.role,verified_at=now()',
        [actor.orgId, actor.userId, actor.role],
      );
      const result = await work(db);
      await db.query('commit');
      return result;
    } catch (e) {
      await db.query('rollback');
      throw e;
    }
  });
}
export async function recordAudit(
  db: PoolClient,
  actor: Actor,
  action: string,
  projectId: string | null = null,
) {
  await db.query(
    'insert into accordly.audit_events(organization_id,actor_id,action,project_id) values($1,$2,$3,$4)',
    [actor.orgId, actor.userId, action, projectId],
  );
}
