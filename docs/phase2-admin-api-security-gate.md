# ENDIKON admin API security gate

Before implementing a D1-backed admin API, the following are required:

1. Verify Cloudflare Access JWT on **every** admin API request, including issuer, signature, audience, expiration, and authorized identity. Never trust an email header alone.
2. Configure a dedicated Cloudflare Access application/policy for `/api/admin/*` (Greek and English UI route protection does not cover APIs).
3. Keep all DB access server-side. Reject requests without a verified admin principal **before** calling D1.
4. Start with a read-only, bounded list endpoint and synthetic rows from `endikon-dev`.
5. Never use demo credentials or accept real personal data until privacy, retention, rate limiting, CSRF protection for mutations, and audit logging are implemented.
6. Verify both authenticated and unauthenticated behavior in the preview environment, and only then deploy.

No API route is enabled by this document.

## Implemented (read-only, fail-closed)

- `GET /api/admin/quotes` checks the Cloudflare Access RS256 JWT against the team's JWKS, issuer, audience, expiry and exact administrator email.
- Missing configuration returns 503; missing/invalid JWT returns 401. D1 is queried only after verification.
- Set Worker environment variables `ACCESS_TEAM_DOMAIN` (e.g. `https://your-team.cloudflareaccess.com`), `ACCESS_ADMIN_AUD` (the dedicated API Access app AUD tag), and `ACCESS_ADMIN_EMAIL` (the authorized administrator).
- **Create an Access application covering `/api/admin/*` with the correct admin-only policy before configuring these variables.** Existing `/el/admin*` and `/en/admin*` policies do not cover API routes.
- Preview and production remain disabled until these variables are explicitly configured. The public quote intake stays disabled.
- Verify deployment build, 401 without JWT, 200 with valid admin JWT, and database reads containing only synthetic records before considering rollout.
