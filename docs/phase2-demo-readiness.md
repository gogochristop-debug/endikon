# Phase 2: isolated D1 demonstration

This PR adds **no public API, form submission, or admin endpoint**. Real personal data collection remains disabled.

## Development database

1. Confirm the target is **endikon-dev** (never a production database).
2. Verify the schema exists: `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;`.
3. Optionally execute `migrations/0002_demo_seed.sql` in the **development** D1 console only. Entries use reserved `example.invalid` domains and fabricated names.
4. Verify the demo rows: `SELECT id, status FROM quote_requests WHERE id LIKE 'demo-quote-%';`.

## Security gate before UI/API integration

- Verify Cloudflare Access for both /el/admin and /en/admin in fresh sessions.
- Enforce **server-side** Cloudflare Access JWT signature, issuer, audience, expiry, and administrator identity checks for every admin API request. A login prompt by itself is insufficient.
- Restrict D1 reads and updates to authorized server routes only. Do not expose DB bindings to client code.
- Add request-level authorization tests and verify access denial for anonymous and non-admin users.
- Keep QUOTE_INTAKE_ENABLED=false until rate limiting, abuse prevention, CSRF/origin checks, privacy and retention review, and error handling are complete.
- Never expose sensitive quote details in logs or email notifications.

The server-only helper in this PR deliberately performs **no authorization**; it must never be wired to a route until that route verifies the administrator.
