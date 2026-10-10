# ENDIKON Phase 2 — staged admin workflow

## Delivered in PR #19
- Server-only quote status validation for the five existing schema states.
- A conditional update that rejects stale status values, with a D1 batch audit event.
- No mutation HTTP endpoint, no public quote intake, no real client data.

## Activation gates (not yet met)
1. Dedicated Cloudflare Access application for `/api/admin/*`, limited to authorized admin identity.
2. Set `ACCESS_TEAM_DOMAIN`, `ACCESS_ADMIN_AUD`, `ACCESS_ADMIN_EMAIL` as Worker settings; verify Access JWT server-side.
3. Confirm the Access app protects the actual API hostname and paths.
4. Implement a POST/PATCH route with strict JSON schema, body size limit, same-origin/CSRF enforcement, and authorization before any DB read/write.
5. Exercise D1 integration tests: valid update, stale update, no event for stale update, audit rollback on insert failure, unauthorized request, and duplicate request.
6. Keep previews synthetic-only; create a separate production database before any real submissions.
7. Complete GDPR privacy notice, retention schedule, deletion policy, and legal review before real data.

## Manual verification checklist
- Unauthenticated GET `/api/admin/quotes` returns 401 or 503, never rows.
- With missing Access configuration, GET returns 503 even if a request supplies forged headers.
- With valid JWT, correct AUD and admin email, GET returns synthetic data only.
- A second update using an outdated `fromStatus` leaves both quote and audit trail unchanged.
- Production does not point to the development D1 database.
