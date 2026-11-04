# Implementation status

## Implemented and locally testable

1. Standalone consent state machine, accessible browser UI, Google Consent Mode adapter.
2. React integration source.
3. Next.js workspace with overview, projects, banner studio, records, integrations, billing simulation, settings/activity.
4. Local project creation, configuration editing, publication, immutable history, rollback.
5. Public configuration and versioned SDK source delivery routes.
6. Interactive demo exercising granular integration gates and withdrawal.
7. Receipt validation, local persistence, deduplication, export, and aggregate decision counts.
8. Fake configuration for external services, with an explicit demo boundary.
9. Unit/domain tests and browser end-to-end tests.

## Scaffolds (unit-tested/typechecked; not deployed or integration-tested)

- PostgreSQL schema: organizations, membership, projects, domains, drafts/releases, receipts, subscriptions, webhooks, usage, audit.
- Cloudflare Worker: R2 configurations/SDK, cached config reads, origin-checked ingestion, bounded payload validation, rate limiting, Queue producer, idempotent R2 archive consumer.
- Wrangler resource bindings.

## Remaining roadmap

### Production foundation

- Implement Clerk organization membership verification on every administrative operation. Add invitations and RBAC. Keep publish credentials server-side.
- Replace the local repository with PostgreSQL. Add reviewed row-level policies, migrations, non-owner runtime roles, integration tests, restore drills, and retention/deletion jobs.
- Implement DNS/HTTP domain ownership challenges. The demo only validates hostname syntax; it does not verify ownership.
- Implement a durable publish service: validate → immutable R2 object → verify read → current pointer → invalidation → audit.
- Connect live billing: Stripe Checkout/Portal, signature-verified webhooks, duplicate event protection, entitlements and usage metering. Never disable visitors’ privacy controls on billing failure.
- Implement robust hosted receipt retry, abuse resistance and observability. CORS is not authentication or proof of user identity.

### Commercial launch

- One supported CMS integration, platform fixtures and installation diagnostics.
- Vendor-specific stop/unload behavior and persistent preference control on actual customer sites.
- Security, accessibility and integration browser testing across supported environments.
- Bundle output/minification, package provenance, version compatibility policy, release CI, documentation site.
- Terms, DPA/subprocessor information, operating region decisions and reviewed product claims.

### Growth and expansion

- Playwright scanning service with resource isolation, SSRF protection, concurrency/cost limits and manual classification overrides.
- Analytics collection with documented purpose, cohort definitions, loss/sampling transparency and retention.
- Experiment assignment, metrics and privacy/accessibility guardrails.
- Agency client workspaces and bulk management.
- Separate agreement-acceptance service and authenticated evidence model.
- Native mobile SDKs and publisher interoperability/approval work.

No certification, universal legal compliance, live billing, production availability, or complete execution of the multi-product roadmap is claimed.
