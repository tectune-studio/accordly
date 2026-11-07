# Public marketing pages

The public landing page lives at `/` in the same Next.js deployment as the app.
Run `npm run dev` from the repository root. On Vercel, keep the existing
`apps/dashboard` project root; no separate marketing project is needed.

- `/`: product, regional guidance, GitHub links and public pricing (`/#pricing`).
- `/sign-in` and `/sign-up`: Clerk authentication.
- `/dashboard`: authenticated overview and organization onboarding.
- Existing workspace routes (`/projects`, `/billing`, etc.) remain authenticated.

`landing-page.tsx` is a Server Component: navigation, product copy and static
sections are rendered without client hooks. `landing-hero.tsx` owns the interactive
consent preview and its scoped GSAP animations. Pricing and bento animations are
separate client islands whose initial content is also server-rendered. The bento
uses a consistent reduced-motion snapshot during hydration, keeping the initial
HTML visible regardless of browser preferences.

Marketing tokens are scoped under `[data-marketing]`, and bento tokens under
`.marketing-feature-bento`, to avoid changing dashboard and Clerk controls. The
public pricing section shares the dashboard plan catalog and does not initiate
checkout.

Landing metadata and factual `WebSite`/`SoftwareApplication` JSON-LD live in
`lib/landing/seo.ts` and are emitted by `app/page.tsx`. Canonical and absolute
social URLs are intentionally unset until a public website origin is configured;
never infer these from the consent-delivery service URL. Keywords describe the
product, but are not a guarantee of search rankings or AI-search inclusion.

`test/e2e/marketing-rendering.spec.ts` checks content and metadata without
JavaScript, plus hydration and consent-preview interactions under both motion
preferences.

Clerk fallback redirects and organization creation/switching target `/dashboard`.
Remove any deployment-level Clerk redirect overrides pointing to `/`, or update
them to `/dashboard`. The public home remains available to signed-in visitors.

The root `enterprise/` directory remains Git-ignored and outside npm workspaces.
Keep proprietary implementations in a separate private repository.
