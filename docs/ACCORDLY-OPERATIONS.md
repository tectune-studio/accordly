# Accordly authentication and database operations

Live mode uses Clerk organizations and PostgreSQL. `ACCORDLY_MODE=demo` retains the isolated local fixture adapter for browser tests. No live administrative request may use that mode.

Every live administrative request verifies the signed Clerk session and fetches the current organization membership from Clerk. Session role claims alone are insufficient. Administrator (`org:admin`) can publish and manage people; Editor (`org:editor`, configure this custom role in Clerk) manages projects/drafts; Viewer (`org:member` or `org:viewer`) reads/exports. Unknown roles fail closed. Sign-in and sign-up pages and organization selection are provided; organization membership management is under Settings.

## Database deployment

The supplied Supabase public URL/key identify the project; private data is accessed through a server-only PostgreSQL adapter, not the browser publishable key. `ACCORDLY_DATABASE_URL` must use the non-owner `accordly_app` role. The adapter rejects superuser/BYPASSRLS credentials. Tenant/user/role context is derived from verified Clerk membership and set with transaction-local PostgreSQL settings. Neither Supabase anon/authenticated roles nor PUBLIC receive private table access.

1. Configure `SUPABASE_DB_URL` securely with the migration-owner connection string.
2. Run `node scripts/database/migrate.mjs`. Migrations use an advisory transaction lock and checksum ledger, compatible with transaction pooling.
3. Run `node scripts/database/provision.mjs` once to generate restricted application and maintenance passwords. This rotates those role passwords and saves URLs only in ignored `apps/dashboard/.env.local`; distribute them securely to deployment secrets before starting live services.
4. Configure `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `ACCORDLY_DATABASE_URL`, and `ACCORDLY_MODE=live` in the application. Keep migration and maintenance credentials out of the application runtime.
5. Enable Organizations and configure the editor role in Clerk. Invitations are sent only when an administrator submits the invitation form.

The new `accordly` schema is separate from the original `infra/postgres` draft. Do not run both as competing schema sources. No migration of existing local JSON records is automatic.

## Retention and deletion

Run `node scripts/database/retention.mjs` hourly with only `ACCORDLY_MAINTENANCE_DATABASE_URL`. The maintenance role can execute the bounded job but cannot directly read application tables. The job removes expired consent records in batches and processes project deletion requests with cascading version/event deletion. Repeat when a batch is full. Schedule it in your job runner; scheduling is not automatically installed in Supabase.

Administrators can set retention through `POST /api/organization/retention` with `{ "days": 180 }`. A project deletion is queued with `POST /api/projects/PROJECT_ID/delete` and `{}`. These operations require current Clerk membership and administrator permissions. Backups follow a separate retention policy; they are not erased by deleting live rows.

## Verification and restore drill

Run `scripts/database/security-test.sql` with `psql -v ON_ERROR_STOP=1` against a disposable migrated database. It rolls back its fixtures and checks tenant isolation, viewer/editor restrictions, publishing, restricted roles, forced RLS, and deletion boundaries.

For a restore drill, take `pg_dump --format=custom` using an authorized backup connection, create a separate empty database, and restore with `pg_restore --exit-on-error --no-owner`. Provision the migration roles on a new server first; roles are cluster objects and are not included in a database dump. Compare table counts and representative tenant records, then rerun the RLS suite against the restored database. Never restore over the live project as a drill. Store backups encrypted with access and retention controls appropriate to consent records.

Live Supabase migration and live Clerk login remain unverified until network/service access succeeds. The app must not be described as deployed solely because its migration file or local tests pass.
