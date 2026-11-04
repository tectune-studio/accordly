# Production architecture and deployment

## Current local environment

Use the existing `/workspace/saas-app` checkout. Each cloud task is already isolated; do not create a worktree unless explicitly requested. Dependencies are in npm workspaces and reproducible with `npm ci`. Copy `.env.example` to `apps/dashboard/.env.local` only when absent. Start the app from repository root with `npm run dev`; use `npm run build` and `npm run start` to validate production bundling. Running processes do not survive environment snapshots.

A local readiness check must include creating/publishing a project, retrieving its config, and making a consent decision on `/demo?project=PROJECT_ID`. Merely checking an open port is insufficient. `npm run test:e2e` automates the main workflow against an isolated production server.

## Control plane

The current app runs on Node.js. Deploy on a Node-compatible host after live authentication and database adapters are implemented. For Cloudflare Workers deployment, add and validate the supported OpenNext adapter against the installed Next.js version. Local filesystem storage cannot be used on Workers or horizontally scaled hosts. The raw SDK demo route reads from the monorepo checkout; package/copy this asset explicitly for standalone deployment.

Use PostgreSQL with backups and a connection pool (Hyperdrive for supported Worker connectivity). The supplied SQL is a starting schema, not a tenant-safe production API. Implement tenant filtering/RLS, runtime roles and least privilege before deployment. Keep immutable configuration records and a separate current-release pointer.

## Delivery plane scaffold

`infra/cloudflare/src/worker.ts` is separate from the Node dashboard. It is typechecked but has not been executed against Cloudflare resources.

Provision R2 `consentkit-configs` and `consentkit-receipts`, Queues `consentkit-decisions` and `consentkit-decisions-dlq`, and a rate-limiting binding. Review resource names and `infra/cloudflare/wrangler.jsonc`; use a pinned, tested Wrangler toolchain when deploying.

Expected objects:

```text
sdk/0.2.0/consent.js
config/PROJECT_ID/RELEASE_ID.json
config/PROJECT_ID/current.json
```

Upload `src/index.js` as `sdk/0.2.0/consent.js`, and upload `loader.js`, `ui.js`, `v1.js`, and `blocking.js` from the same source directory alongside it. Preserve `legacy/0.1.0/consent.js` at its original URL. Release objects contain the consent config plus delivery metadata:

```json
{
  "projectId": "PROJECT_ID",
  "version": "RELEASE_ID",
  "title": "Your privacy, your choice",
  "description": "Choose optional processing.",
  "privacyUrl": "https://customer.example/privacy",
  "expirationDays": 180,
  "purposes": [
    {
      "id": "necessary",
      "name": "Necessary",
      "description": "Essential functions",
      "required": true
    },
    {
      "id": "analytics",
      "name": "Analytics",
      "description": "Usage measurement",
      "required": false
    }
  ],
  "allowedOrigins": ["https://customer.example"],
  "domainVerified": true
}
```

Only the future authenticated publish service may set `domainVerified`, after actual ownership verification. Never set it from unchecked customer input. A public project ID is not a credential. Origin checks reduce browser misuse but do not authenticate a visitor or prevent forged server-to-server events.

Write the immutable release first, confirm it exists, then update `current.json`. Cache release paths for a year, current pointers for 30 seconds. Immediate rollback needs cache invalidation; otherwise pointer propagation follows the TTL. Configure route/CDN caching for SDK delivery; R2 storage itself is not a delivery-cache policy. Add error classification and CORS headers on ingestion failures when hardening the scaffold.

The queue consumer archives receipts to deterministic per-project/per-receipt R2 object keys using conditional writes. This is not the PostgreSQL analytics pipeline. Add database ingestion or a separate analytics processor when needed. Configure bucket lifecycle retention, deletion across stores, queue lag monitoring, dead-letter replay and reconciliation.

## Release gates

- Real authentication, project ownership, RBAC and tenant isolation tests.
- Verified-domain publishing and origin policy.
- Stripe webhook signature verification and idempotent updates.
- Browser tests of tag ordering, prior-consent blocking and vendor teardown.
- Failure tests for config loss, offline receipt delivery and cache propagation.
- Load tests for cache misses, queue ingestion, and database writes.
- Restore drill, secret management, redacted logs and monitoring.
- NPM package build/release verification and provenance.

Do not put tokens in source, public configuration or client bundles. Enter real credentials in deployment secret settings. Dummy values exist only to make local development explicit and self-contained.
