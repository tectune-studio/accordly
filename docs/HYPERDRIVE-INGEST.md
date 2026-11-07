# Ingestion using the existing accordly-delivery Worker

The repository Worker now accepts POST `/ingest?projectId=PROJECT_ID`. Body: the version-1 consent event JSON. Browsers must supply their real Origin (automatically supplied by fetch). OPTIONS preflight is supported. No new Worker is needed. Existing publishing and receipt routes remain available.

## Setup

1. Apply `supabase/migrations/202611070001_worker_ingestion.sql` using the existing migration runner: `node scripts/database/migrate.mjs` with the migration-owner SUPABASE_DB_URL configured. This creates the restricted `accordly_ingest` login, schema usage and a single security-definer function grant. No table access is granted.
2. Set a strong password for that login securely using your database administrator tooling (for example psql's `\password accordly_ingest`). Do not commit passwords.
3. Edit the Hyperdrive origin: session pooler `aws-0-eu-west-1.pooler.supabase.com`, port 5432, database `postgres`, username `accordly_ingest.tflltlqhpwumhegzuosf`, and that login's password. Require TLS. Disable Hyperdrive query caching. Test connectivity.
4. Wrangler now contains binding HYPERDRIVE with ID `f7229a57a0f74f15b713d0c40a6943e6` and `nodejs_compat`. Database credentials live in Hyperdrive, not Wrangler. The driver uses `env.HYPERDRIVE.connectionString`.
5. Run `npm ci` at the repository root. Deploy from `infra/cloudflare` with `npx wrangler deploy`. Deploy the repository, not only worker.ts: the Worker imports schema validation and the ingestion module, and bundles the pg dependency.
6. Set the intended integration origin to `ACCORDLY_INGEST_URL=https://consent.tectune.in/ingest`. Clients must append `?projectId=...`. Existing SDK integrations are not automatically redirected by that variable; preserve old paths during rollout.
7. Publish and verify a project before testing. The endpoint reads its verified current pointer and immutable config from CONFIGS before any database connection. The database checks domain verification again. GET `/health` reports Worker liveness only, not database health.

Successful inserts and identical event retries return 200. Database outage with successful Queue fallback returns 202. Queue messages carry the validated event and origin; the consumer retries the same database operation and acknowledges only after success. Existing legacy Queue messages retain their R2 archival behavior. Conflicting UUIDs return 409. Total persistence failure returns 503 and Retry-After; the caller must retain its bounded retry outbox until HTTP acknowledgement. A sendBeacon boolean alone is not a persistence acknowledgement.

No IP address or full URL is stored in the event. IP is used transiently for the Worker rate limiter. Configure the Cloudflare edge rate-limiting rule separately to protect Worker invocations.

## Verification and scope

Unit tests exercise origin rejection, schema rejection, size limits, database-first behavior, Queue fallback, conflict rejection and retryable total failure. The PostgreSQL migration and live Hyperdrive connection still require deployment validation. Queue daily-budget tracking and pending-R2 replay are not implemented by this change. Monitor and drain the configured dead-letter queue; do not delete failed messages. The static R2 publishing migration and monthly visitor counters remain separate work.
