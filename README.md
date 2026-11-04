# ConsentKit

An open-core consent management starter: a standalone NPM consent engine and a Next.js control plane. Includes a functioning local project → edit → publish → consent → receipt/export workflow, with dummy environment variables for future hosted services.

## Run locally

Requires Node.js 24+ and npm. The edge unit tests use Node’s native TypeScript support.

```sh
npm ci
cp .env.example apps/dashboard/.env.local # only when no local configuration exists
npm run dev
```

Open the dashboard on port 3000. Create a project or use Studio website, open **Banner studio**, publish, then open the published demo. Accept, reject, customize, or withdraw consent; return to **Consent records** to inspect and export the resulting decisions.

```sh
npm test          # state, validation, gate, persistence, and edge-unit tests
npm run typecheck # dashboard, React adapter, and edge scaffold
npm run build
npm run start
npm run test:e2e  # requires build and system Chromium; starts isolated server on 3100
```

Set `PLAYWRIGHT_CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`. Alternatively install Playwright Chromium and point that variable at its executable. The browser suite uses a separate `.data/e2e` directory; normal local data is in `apps/dashboard/.data`. Both are ignored. Tests create their own uniquely named projects. No external services are contacted in demo mode.

## What works

- Responsive dashboard, searchable projects, configuration editor, visual preview, publishing, immutable versions, rollback, audit activity.
- Framework-independent consent SDK: default-denied optional purposes, granular preferences, required-purpose enforcement, expiration/version invalidation, withdrawal, browser persistence, subscription/gate API, accessible Shadow DOM dialog.
- Google Consent Mode default/update adapter; no Google tags are loaded automatically.
- React provider and hook source package.
- Working demo website with local integration simulations and a bounded receipt retry outbox.
- Server validation, deduplication, decision records, JSON export, real decision breakdowns.
- Locally simulated subscription plan selection. No payment information is collected.

## Demo boundaries

`CONSENTKIT_MODE=demo` explicitly enables the local single-organization demo. Its administrative endpoints are unauthenticated. **Do not expose this mode as a public hosted SaaS.** Non-demo mode rejects API access and displays a setup-required page. `.env.example` contains deliberately fake Clerk, Stripe, PostgreSQL, and Cloudflare values; they are not usable credentials.

Persistence uses serialized, atomic local JSON writes in one Node process. It is not a multi-instance database. Data remains until deleted; automated retention/deletion is not implemented. `CONSENTKIT_DATA_DIR` can override its location. No page-load telemetry is collected; plan quotas and traffic billing are not implemented. Receipt ingestion in the demo is same-origin; the production Worker scaffold has a separate cross-origin ingestion design.

CMS plugins, a scanner, experiment engine, native mobile SDKs, terms acceptance, live Clerk auth, real Stripe billing, and hosted PostgreSQL persistence are **not implemented**. Integration cards and pricing identify their status. The SQL and Worker sources are scaffolds, not a deployed or production-validated platform. See [implementation status](docs/IMPLEMENTATION.md) and [production guide](docs/PRODUCTION.md).

## Workspace

```text
apps/dashboard/           Next.js dashboard, demo site, local APIs
packages/consent-core/     Apache-2.0 standalone JS package + declarations
packages/consent-react/    React provider/hook source package
infra/cloudflare/         Delivery + queue Worker scaffold and Wrangler config
infra/postgres/           Initial relational schema scaffold
```

The core is usable without the dashboard, a subscription, or any network service. See its [package documentation](packages/consent-core/README.md). The React package currently exports TypeScript source and requires a compatible bundler; compile distribution files before a public NPM release. Names under `@consentkit` are provisional and have not been reserved or published.

## License

The existing repository Apache-2.0 license remains unchanged. Core packages use the same license. If proprietary hosted modules are introduced later, define that boundary and licensing explicitly before release.
