# Domain ownership

In live Banner Studio, administrators generate either a DNS TXT challenge or an HTTPS file challenge. Viewers/editors can see verification status but only administrators may issue or check a challenge. Clerk membership is checked for each request; records are isolated by organization RLS.

- `GET /api/projects/:id/domain`: status, without token/hash.
- `POST /api/projects/:id/domain/challenge` with `{ "method": "dns" }` or `{ "method": "http" }`: return one-time token/instructions.
- `POST /api/projects/:id/domain/verify` with `{}`: check ownership server-side.

DNS: add the exact token as a TXT record at `_accordly-challenge.HOSTNAME`. TXT chunks are joined within each record; different TXT records are checked separately.

HTTP method: serve the exact token as plain text at `https://HOSTNAME/.well-known/accordly-verification.txt`. A trailing newline is allowed. HTTPS with a valid hostname certificate is required; redirects, non-200 responses, and bodies above 4096 bytes are rejected. Public IPv4 addresses are checked and the approved address is pinned to the TLS connection to prevent DNS rebinding. IPv6-only sites should use DNS verification. Both network checks have bounded timeouts. Runtime egress must permit DNS and HTTPS to customer domains; no customer verification request is made by demo mode.

Tokens contain 256 random bits, expire after 24 hours, and are stored only as SHA-256 hashes. Regeneration rotates the challenge and clears previous verification. Challenge creation has a 60-second cooldown; checks have a 30-second cooldown. Final verification checks the current challenge ID/hash/domain and expiry again to reject rotation races.

Proof is scoped to the exact project/hostname; `example.com` does not verify `www.example.com`. Verification lasts 30 days. A domain change invalidates it. Live publishing/rollback and public config delivery require current proof at the database boundary. Expired verification stops new config delivery; cached assets may remain until their cache TTL expires. Demo publishing remains available with an explicit live-only UI boundary.

Run the existing migration runner to apply migrations `202611040002_domain_ownership.sql` and `202611040003_invalidate_domain_change.sql` after the initial Accordly migration. The latter clears proof and the active release when a domain changes, including when changed back to the previous name. Existing live projects start unverified and must prove ownership before publishing or delivery resumes. This change does not synchronize verification into already-deployed Cloudflare R2 objects; the future publish pipeline must use the database's current proof.
