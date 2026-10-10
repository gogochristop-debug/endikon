# ENDIKON Phase 2 — D1 setup checklist

**Current status: schema only. No production database, API, authentication or notification service is connected.**

1. Create separate Cloudflare D1 development and production databases in the owner's Cloudflare account.
2. Run `migrations/0001_quote_requests.sql` **against development first** using Wrangler's D1 execute/migrations workflow after verifying the target database ID. Do not apply against production until reviewed.
3. Add the correct D1 binding to the Cloudflare Worker configuration; do not guess database IDs or commit credentials.
4. Build a server-only quote intake endpoint with validation, service allowlist, rate limits, origin/CSRF defenses, abuse prevention and privacy notices. Keep the feature disabled until verified.
5. Add authenticated admin access and per-action authorization **before** exposing any read/update API. Audit status changes and protect backups.
6. Configure `info@endikon.com` as the notification destination only after mailbox ownership and delivery provider are confirmed. Do not include confidential case details in email.
7. Define lawful basis, retention/deletion schedule, data-subject rights process and processor agreements with appropriate legal review.
8. Run lint, typecheck, build and security tests before merging any public data handling.

**Important:** Cloudflare D1 provides persistence, not field-level encryption, access control, or GDPR compliance automatically. Legal case details can be highly sensitive. Production access must be strictly server-side and authorized; consider minimizing free-text intake until legal/privacy review.
