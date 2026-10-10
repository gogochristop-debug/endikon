# ENDIKON admin API security gate

Before implementing a D1-backed admin API, the following are required:

1. Verify Cloudflare Access JWT on **every** admin API request, including issuer, signature, audience, expiration, and authorized identity. Never trust an email header alone.
2. Configure a dedicated Cloudflare Access application/policy for `/api/admin/*` (Greek and English UI route protection does not cover APIs).
3. Keep all DB access server-side. Reject requests without a verified admin principal **before** calling D1.
4. Start with a read-only, bounded list endpoint and synthetic rows from `endikon-dev`.
5. Never use demo credentials or accept real personal data until privacy, retention, rate limiting, CSRF protection for mutations, and audit logging are implemented.
6. Verify both authenticated and unauthenticated behavior in the preview environment, and only then deploy.

No API route is enabled by this document.