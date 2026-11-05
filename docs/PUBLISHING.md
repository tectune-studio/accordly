# Durable Cloudflare publishing

Live publish and rollback requests require a freshly checked Clerk organization administrator and a verified domain. Demo mode remains local.

## Publication protocol

1. Lock the project, validate its draft, generate a release and schema-v1 banner hash, then commit the immutable PostgreSQL release and a `publish_jobs` row. A unique partial index allows one unfinished job per project.
2. The dashboard calls the Worker's authenticated `/internal/publish/objects` endpoint. The Worker validates both documents and their hash, then conditionally creates `config/{project}/{releaseId}.json` and `config/{project}/{configHash}.json`. Existing objects must match byte for byte. Each object is read back before the job advances to `stored`.
3. `/internal/publish/current` verifies the referenced artifacts and conditionally replaces `config/{project}/current.json`. This small pointer contains release ID, config hash, monotonic database generation, allowed HTTPS origin and ownership expiry. R2 ETag conditions and generation fencing reject concurrent or stale writers. Replaying the same pointer is a success.
4. Purge the canonical current URLs through Cloudflare's zone Cache Purge API. Both HTTP status and Cloudflare's `success` acknowledgement must succeed before recording `invalidated`.
5. In one PostgreSQL transaction, activate the release, append an audit event containing release/job IDs, and mark the job completed. Public dashboard APIs exclude staged releases.

Every step locks the project and commits its phase separately. Network calls have a 15-second deadline. A crash after an external side effect but before its phase commit is safe to retry. A purge failure leaves the job pending and does not append a success audit. The R2 pointer may already be visible while database finalization is pending: this is a recoverable workflow across services, not a distributed atomic transaction.

Current delivery reads bypass caches (`no-store`), preventing stale current pointers across POPs or query-string variants. Immutable release and hash URLs retain one-year cache lifetimes. Cache purge is still required to remove earlier cached current responses; do not add a Cloudflare rule that overrides `no-store` for current routes. This beta trades an R2 read per current request for reliable pointer visibility; measure volume before adding a distributed current-cache protocol.

## Recovery and idempotency

- `POST /api/projects/{project}/publish` accepts `{ "requestId": "<uuid>" }`. Retain the same UUID when retrying. A completed request ID returns its original result without republishing or duplicating its audit.
- `POST /api/projects/{project}/rollback` accepts `{ "releaseId": "rel_...", "requestId": "<uuid>" }` and uses the same protocol with a new generation.
- `GET /api/projects/{project}/publishes` lists the latest 20 jobs, phases and safe failure messages for the current organization.
- Banner Studio displays pending publications and a **Resume publication** button. Resume uses the saved release; subsequent draft edits need another publish after completion. With no request ID, an unfinished project job is resumed automatically.
- Recovery is initiated by an authenticated administrator, not an unattended cron impersonating a user. Monitor unfinished jobs and resume after restoring the dependency. A request can take roughly 60 seconds across all steps; configure the dashboard request timeout accordingly. Shorter request budgets are safe but may require resume.
- If proof expired during an unfinished job, verify the same domain again and resume. The job refreshes its proof expiry and generation before replaying publication. A different hostname cannot inherit the pending release's proof.

## Cloudflare beta configuration

Set server variables in the dashboard deployment's secret settings. Never use `NEXT_PUBLIC_` for these credentials.

| Variable                   | Value / permissions                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ACCORDLY_DELIVERY_ORIGIN` | HTTPS custom domain in the selected Cloudflare zone, e.g. `https://consent.example.com`; no path or query |
| `ACCORDLY_PUBLISH_SECRET`  | Random secret of at least 32 characters; shared only with this deployment's Worker                        |
| `CLOUDFLARE_ZONE_ID`       | Zone containing the delivery hostname                                                                     |
| `CLOUDFLARE_API_TOKEN`     | Token restricted to **Zone → Cache Purge** for that zone                                                  |
| `CLOUDFLARE_ACCOUNT_ID`    | Used by Wrangler during deployment, not the dashboard publishing requests                                 |

Set the matching Worker secret with `wrangler secret put PUBLISH_SECRET --config infra/cloudflare/wrangler.jsonc`. Do not place it in Wrangler configuration or Git. The internal routes fail closed without it. Keep the config bucket private: immutable archives are exposed through the Worker, and R2 write access is limited to the Worker binding and operators.

Configure `CONFIGS` and `RECEIPTS` R2 bucket names, queue names and the delivery custom domain in `infra/cloudflare/wrangler.jsonc`. Existing names are placeholders. Deployment needs a separate operator identity/token with Workers Scripts Edit, Workers R2 Storage Edit, Queues Edit and Workers Routes Edit for the chosen account/zone. Supply that deployment token to Wrangler as `CLOUDFLARE_API_TOKEN` **only for the deployment command**, rather than replacing the dashboard's limited purge token. Create the custom-domain DNS record through Cloudflare if it is not provisioned automatically. A `workers.dev` hostname alone does not provide your own zone for this purge flow.

Apply migrations `202611040001` through `202611040004` using the existing migration runner and the owner connection. The application still uses restricted `ACCORDLY_DATABASE_URL`. Existing releases must be published/restored through the durable flow before public dashboard delivery resumes; the migration does not assert that old database releases were uploaded to R2.

Beta verification: publish a verified test project, inspect the two immutable R2 objects and current pointer, fetch `/config/{project}/current` and `/v1/config/{project}`, then confirm a completed job and audit. Temporarily remove Cache Purge permission to check a pending `pointed` job, restore it, and resume. Retry the same request ID and verify there is one success audit. Roll back and verify the generation increases.

## Operational limits

Worker artifacts enforce the ownership expiry captured at publication. Renew ownership and republish before that expiry. Immediate revocation on domain challenge rotation, project deletion, or domain change requires an additional delivery-revocation workflow; until implemented, an already published R2 pointer can remain usable until its captured expiry. Keep this limitation in scope for beta testing.

Keep database generations with the production R2 state during disaster recovery. Restoring a database snapshot with a lower sequence than a current R2 generation causes safe rejection of stale publication; an operator must advance the sequence above all retained pointer generations before publishing again. Never delete immutable objects to resolve a content conflict. R2 archive/receipt retention and orphan cleanup remain separate infrastructure tasks.

Automated checks cover read-back corruption, replay after lost commits, stale/concurrent pointer updates, failed invalidation, auth, proof expiry, tenant isolation, staged-release visibility and role restrictions. Cloudflare deployment and live end-to-end checks need the configured beta credentials.
