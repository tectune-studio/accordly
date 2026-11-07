# Accordly

An open-core consent management starter: a standalone NPM consent engine and a Next.js control plane. Includes a functioning local project → edit → publish → consent → receipt/export workflow, with dummy environment variables for future hosted services.

Accordly now includes a Clerk organization/RBAC integration and a server-only PostgreSQL adapter with forced row-level policies, migrations, restricted runtime roles, and maintenance jobs. See [Accordly operations](docs/ACCORDLY-OPERATIONS.md). Migrations and isolation/restore checks passed against disposable PostgreSQL; the live Supabase connection remains refused, so remote migration and live login verification are still pending. Existing `@accordly` package names remain for compatibility.

## Run locally

Requires Node.js 24+ and npm. The edge unit tests use Node’s native TypeScript support.

```sh
npm ci
cp .env.example apps/dashboard/.env.local # only when no local configuration exists
npm run dev
```

Open `http://localhost:3000` for the public landing page, pricing and GitHub links. Use **Log in** or **Sign up** to enter the app; successful authentication and organization onboarding lead to `/dashboard`. In demo mode, open `/dashboard` directly. Create a project or use Studio website, open **Banner Studio**, publish, then open the published demo. Accept, reject, customize, or withdraw consent; return to **Consent records** to inspect and export the resulting decisions.

```sh
npm test          # state, validation, gate, persistence, and edge-unit tests
npm run typecheck # dashboard, React adapter, and edge scaffold
npm run build
npm run start
npm run test:e2e  # requires build and system Chromium; starts isolated server on 3100
```

Set `PLAYWRIGHT_CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`. Alternatively install Playwright Chromium and point that variable at its executable. The browser suite uses a separate `.data/e2e` directory; normal local data is in `apps/dashboard/.data`. Both are ignored. Tests create their own uniquely named projects. No external services are contacted in demo mode.

## Feature checklist

Checked items are available in the local demo or source packages. Unchecked items require implementation or production integration; dummy credentials do not enable live services.

### Available

- [x] Public homepage with GSAP animations, shared pricing catalog, GitHub links and Clerk login/signup entry points.
- [x] Responsive Next.js dashboard with Tailwind CSS v4 and Google Sans.
- [x] Project creation and project/domain search.
- [x] Banner editor with text, privacy URL, accent color, expiration, purpose descriptions, and visual preview.
- [x] Local draft saving, publishing, immutable configuration versions, and rollback.
- [x] Public configuration and versioned SDK delivery routes for local development.
- [x] Standalone consent engine without hosted account requirements or built-in telemetry.
- [x] Granular preferences, required-purpose enforcement, accept/reject controls, and withdrawal.
- [x] Secure SameSite=Lax first-party cookies mirrored in localStorage, expiration, and configuration-version invalidation.
- [x] Versioned JSON Schema contracts, generated TypeScript/Zod validators, config hashes, and UUIDv7 events.
- [x] Lazy banner UI, synchronous Google defaults, explicit script/iframe blocking, and regional GPC handling.
- [x] Shadow DOM consent dialog with keyboard navigation and focus handling.
- [x] Explicit integration gates with start/stop callbacks and consent-change subscriptions.
- [x] Google Consent Mode default/update adapter; Google tags are not loaded automatically.
- [x] React provider and consent hook source package.
- [x] Interactive demo site with simulated analytics/marketing and a bounded receipt retry outbox.
- [x] Receipt validation, deduplication, local persistence, JSON export, and decision breakdowns.
- [x] Local audit history and workspace status.
- [x] Simulated subscription selection; no checkout or payments.
- [x] Dummy environment configuration for future third-party integrations.
- [x] Unit/domain tests, mocked edge tests, browser end-to-end tests, and CI configuration.

### Scaffolded — production integration pending

These files exist, but their presence does not mean the hosted capability is ready.

- [x] Implement authenticated PostgreSQL storage, tenant policies, migration scripts, and restricted runtime roles; remote Supabase rollout is pending.
- [ ] Deploy and integrate the Cloudflare delivery/ingestion Worker with R2, Queues, rate limiting, and receipt archives.
- [x] Durable authenticated publishing: validated release → immutable R2 write/read verification → conditional current pointer → cache invalidation → audit, with resumable PostgreSQL jobs and rollback. Cloudflare beta deployment is pending; see [publishing operations](docs/PUBLISHING.md).

### Yet to be implemented

- [x] Implement Clerk authentication, per-request organization membership verification, invitations, and role-based permissions; live login verification is pending.
- [x] DNS TXT and HTTPS-file domain challenges, expiry, SSRF protection, and database publishing guards. Live migration rollout is pending.
- [ ] Stripe Checkout, Customer Portal, verified webhooks, and subscription entitlements.
- [ ] Managed-load metering, plan quotas, usage alerts, and overage billing.
- [ ] Production receipt delivery/reconciliation, retention, deletion, and backup/restore workflows.
- [ ] Production monitoring, abuse controls, and load/failure testing.
- [ ] Vendor-specific integration adapters, teardown behavior, and installation diagnostics.
- [ ] WordPress, Shopify, and PrestaShop integrations.
- [ ] Scheduled website scanning, cookie/vendor detection, and change reports.
- [ ] Advanced analytics, segmentation, and reporting.
- [ ] A/B experiments with assignment, metrics, and privacy/accessibility guardrails.
- [ ] Agency client workspaces, delegated access, templates, and bulk management.
- [ ] Versioned terms/contracts acceptance and authenticated evidence exports.
- [ ] Native iOS/Android SDKs and React Native/Flutter integrations.
- [ ] Publisher interoperability and applicable certification/approval work.
- [ ] Enterprise SSO and data residency options.
- [ ] Production accessibility/security review and legal/product documentation.
- [ ] Compiled NPM distribution builds, provenance, release automation, and public package publishing.

For versioned API and compatibility rules, see the [schema contracts](packages/schema/README.md). The SDK is now version 0.2.0; the original 0.1.0 delivery artifact remains available for cached clients.

## Demo boundaries

`ACCORDLY_MODE=demo` explicitly enables the local single-organization demo. Its administrative endpoints are unauthenticated. **Do not expose this mode as a public hosted SaaS.** Live mode requires Clerk authentication and the restricted PostgreSQL runtime connection. `.env.example` contains placeholders only; supply real credentials securely in deployment settings.

Demo persistence uses serialized local JSON writes; `CONSENTKIT_DATA_DIR` overrides its location. Live persistence uses PostgreSQL. Retention/deletion jobs are implemented and must be scheduled with the separate maintenance credential. No page-load telemetry is collected; plan quotas and traffic billing are not implemented.

CMS plugins, a scanner, experiment engine, native mobile SDKs, terms acceptance, and real Stripe billing are **not implemented**. Cloudflare deployment remains pending. The canonical database migration is under `supabase/migrations`; the older `infra/postgres` file is a superseded design scaffold.

## Styling

The dashboard uses Tailwind CSS v4 with the official `@tailwindcss/postcss` plugin in `apps/dashboard/postcss.config.mjs`. Its CSS-first entry point is `apps/dashboard/app/globals.css`; no v3-style `tailwind.config.js` or `@tailwind` directives are needed. Tailwind automatically discovers dashboard source classes.

Use theme utilities such as `bg-canvas`, `bg-surface`, `text-ink`, `text-muted`, `bg-brand`, `border-line`, and `font-sans`. Google Sans is supplied by the existing Next.js font loader. Shared dashboard layouts use utilities; existing component CSS retains the detailed visual treatment and responsive rules. When migrating more components, remove conflicting legacy declarations because unlayered CSS overrides Tailwind's layered utilities.

The standalone SDK owns its Shadow DOM stylesheet and has no Tailwind dependency.

## Project structure

This npm-workspaces monorepo separates the hosted dashboard, reusable consent packages, and deployment infrastructure.

```text
saas-app/
├── apps/
│   └── dashboard/
│       ├── app/
│       │   ├── api/[...path]/route.ts  # Local project, publishing, receipt, export and billing APIs
│       │   ├── demo/                  # Interactive consent test website
│       │   ├── dashboard.tsx          # Dashboard views and workspace interactions
│       │   ├── globals.css            # Tailwind entry point, theme tokens and component styles
│       │   ├── layout.tsx             # Shared layout, metadata and Google Sans
│       │   └── page.tsx               # Dashboard entry and demo-mode guard
│       ├── lib/
│       │   ├── domain.mjs             # Configuration, project and receipt validation
│       │   └── store.mjs              # Single-process local JSON persistence and audit helpers
│       ├── test/                     # Domain and persistence tests
│       └── postcss.config.mjs        # Official Tailwind v4 PostCSS plugin
├── packages/
│   ├── consent-core/
│   │   ├── src/                      # Standalone engine, browser UI and TypeScript declarations
│   │   └── test/                     # Consent state, gates, storage and adapter tests
│   ├── schema/                       # Versioned JSON Schemas, examples, generated types and validators
│   └── consent-react/
│       └── src/                      # React provider and consent hook
├── infra/
│   ├── cloudflare/
│   │   ├── src/worker.ts             # Edge delivery, ingestion and queue consumer scaffold
│   │   ├── test/                     # Mocked edge unit tests
│   │   └── wrangler.jsonc            # Cloudflare resource bindings
│   └── postgres/001_initial.sql      # Relational schema scaffold
├── test/e2e/                         # Browser workflow tests
├── docs/                             # Implementation status and production architecture
├── .github/workflows/ci.yml          # Verification workflow
├── .env.example                      # Dummy configuration only
├── playwright.config.ts              # Browser and isolated test-server configuration
├── package.json                      # Workspace definitions and shared commands
└── package-lock.json                 # Reproducible dependency versions
```

Local `.env.local` files, `.data/` stores, `node_modules/`, `.next/`, and browser test outputs are ignored by Git. See [implementation status](docs/IMPLEMENTATION.md) for remaining engineering work and the [production guide](docs/PRODUCTION.md) for infrastructure requirements.

The core is usable without the dashboard, a subscription, or any network service. See its [package documentation](packages/consent-core/README.md). The React package currently exports TypeScript source and requires a compatible bundler; compile distribution files before a public NPM release. Names under `@accordly` are provisional and have not been reserved or published.

## License

The existing repository Apache-2.0 license remains unchanged. Core packages use the same license. If proprietary hosted modules are introduced later, define that boundary and licensing explicitly before release.

## Combined website deployment

Deploy `apps/dashboard` on Vercel for both the public website and authenticated app. The former standalone marketing app is now `apps/dashboard/components/marketing`; no second deployment is required. Keep existing service variables. If Clerk redirect environment overrides still point at `/`, update them to `/dashboard`. See [public route details](apps/dashboard/components/marketing/README.md).
