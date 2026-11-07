# Public marketing pages

The public landing page lives at `/` in the same Next.js deployment as the app.
Run `npm run dev` from the repository root. On Vercel, keep the existing
`apps/dashboard` project root; no separate marketing project is needed.

- `/`: product, regional guidance, GitHub links and public pricing (`/#pricing`).
- `/sign-in` and `/sign-up`: Clerk authentication.
- `/dashboard`: authenticated overview and organization onboarding.
- Existing workspace routes (`/projects`, `/billing`, etc.) remain authenticated.

GSAP and marketing CSS are loaded by the landing page. Styles are scoped under
`.accordly-marketing` to avoid changing dashboard and Clerk controls. The public
pricing section shares the dashboard plan catalog and labels unimplemented paid
plans as proposed. It does not initiate checkout.

Clerk fallback redirects and organization creation/switching target `/dashboard`.
Remove any deployment-level Clerk redirect overrides pointing to `/`, or update
them to `/dashboard`. The public home remains available to signed-in visitors.

The root `enterprise/` directory remains Git-ignored and outside npm workspaces.
Keep proprietary implementations in a separate private repository.
