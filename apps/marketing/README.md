# Accordly marketing

Independent Next.js marketing app. From the repository root:

- `npm ci`
- `npm run dev:marketing` (port 3001)
- `npm run build:marketing`
- `npm run start:marketing`

Deploy on Vercel with root directory `apps/marketing`, allowing workspace files outside the root. No Clerk, database or Stripe secrets are required. The dashboard remains a separate deployment at accordly.tectune.in.

GSAP scroll reveals and the decorative orbit respect prefers-reduced-motion. The consent preview only changes local component state; it does not grant consent or load tracking. The page links to the public source and dashboard billing page. Feature copy distinguishes the implemented foundation from planned enterprise capabilities and does not promise legal compliance.

## Proprietary boundary

The local root `enterprise/` directory is ignored by Git and excluded from npm workspace patterns. It must not be imported by this app or public packages. Create a separate private repository for real enterprise implementation; do not force-add proprietary code to this public repository. Directory creation and ignored files are local only and will not appear in a fresh clone.
