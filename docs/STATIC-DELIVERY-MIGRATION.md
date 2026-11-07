# Static delivery migration status

This migration is not deployed. Existing Worker delivery and publishing routes remain active until replacement publishing and ingestion are verified.

## Implemented locally

The classic loader caches configurations for one hour in localStorage. A fresh cached configuration with a valid consent cookie skips configuration fetches. Fresh configurations without a decision refresh in the background; expired configurations refresh before initialization and fall back to validated cached content on network failure. Storage failures do not block initialization. No decision event is emitted for these reads.

Country detection attempts the configuration origin's `/cdn-cgi/trace` with a two-second timeout and omitted credentials. It extracts only `loc`; it does not persist trace output or its IP field. Unknown country always selects opt-in, even when the wildcard regional rule is opt-out.

## Required before production cutover

- Build the SDK and lazy UI into content-addressed artifacts; upload and verify their contents via R2 S3. Keep historical artifacts for installed scripts.
- Add an S3 adapter preserving existing conditional immutable writes and generation checks. Publish `cfg/<projectId>.json` and read it back before purging that URL. Do not weaken concurrency checks when materializing the current configuration.
- Attach `cdn.accordly.tectune.in` to a bucket containing only public configurations and SDK files. Receipts and pending NDJSON must remain private. Set CORS for browser GET requests. Test trace CORS from a customer origin.
- Configure cache rules: immutable hashed SDK assets one year; `cfg/` five minutes. Purge canonical config URLs on every publication. Use a cache key that does not allow query variants to evade invalidation.
- Provision a restricted ingestion database role and Hyperdrive binding. Ingest must validate verified origins, bounded bodies and event schemas before SQL, and atomically deduplicate events and monthly decision-makers.
- Implement Queue fallback only after transient database failure. Use durable shared queue-budget accounting, including consumer retries, rather than a per-isolate counter. Write overflow to private pending NDJSON objects. Replay with bounded scheduled batches; delete only after database acknowledgement.
- Expose month/project decision-browser counters and the 80% alert. Align the shared pricing catalog and dashboard wording only when the new metric is implemented. Subject IDs should be pseudonymized with a server-side key; event payloads must not include raw IPs.
- Add edge rate limiting before Worker execution, exact Origin validation, body caps and retryable failure responses. Preserve the existing browser outbox and do not acknowledge an event until a durable destination accepts it.
- Test historical-script compatibility before replacing Worker custom-domain routing with `/ingest` and health-only routes. Old script endpoints currently depend on the Worker.

## Cloudflare documentation checked

- https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/ documents `/cdn-cgi/` as Cloudflare-managed and trace for troubleshooting. It does not guarantee a cross-origin country-detection contract on every R2 custom hostname. Detection is best effort, with opt-in fallback.
- https://developers.cloudflare.com/waf/rate-limiting-rules/ lists **one rate-limiting rule on Free**. Free expressions support Path and Verified Bot, with IP counting. Configure the permitted counting period and mitigation duration in the dashboard; the in-Worker limiter does not protect the Worker request allowance.

## Deployment inputs still needed

Server-only Vercel R2 access key/secret, account endpoint and public bucket name; Hyperdrive binding ID connected to a dedicated restricted Supabase role; confirmation of the R2 CDN custom-domain attachment. Keep existing Cloudflare zone/cache-purge credentials server-side. Do not expose S3 keys, database URLs or ingestion credentials in NEXT_PUBLIC variables.

Dummy values are provided in the root `.env.example` and `infra/cloudflare/env.example` for development planning. `ACCORDLY_R2_ACCESS_KEY_ID`, `ACCORDLY_R2_SECRET_ACCESS_KEY`, `ACCORDLY_R2_ENDPOINT` and `ACCORDLY_R2_CONFIG_BUCKET` belong in Vercel's server environment when the S3 publisher is implemented. `ACCORDLY_CDN_ORIGIN` and `ACCORDLY_INGEST_URL` describe the intended public endpoints. `CLOUDFLARE_HYPERDRIVE_ID` is a deployment input to copy into a Wrangler `hyperdrive` entry named `HYPERDRIVE`; setting that environment variable alone does not create a binding. These planned variables are not yet consumed by the existing publisher or Worker. Do not replace current production settings or remove current routes using these placeholders.
