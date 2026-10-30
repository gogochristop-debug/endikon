# ENDIKON CRM rollout

This branch introduces **schema only**. It does not apply the D1 migration or enable real client data entry.

## Design
- Clients are separate from legacy client user IDs.
- Case associations use an explicit link table, avoiding changes to existing cases.
- Audit records store action metadata without copying personal data.
- Soft deletion preserves referential integrity.

## Implementation gates
1. Test migration against a disposable development D1 with existing case schema.
2. Add Cloudflare Access-protected server endpoints with authorization checks for every operation.
3. Validate lengths and formats, use bound SQL parameters and same-origin protection for writes.
4. Ensure client-case links cannot cross authorization or tenant boundaries.
5. Write audit records in the same transaction as changes.
6. Add GDPR retention, access, export and deletion policies before storing real client data.
7. Run typecheck, lint, build, and authorization tests before deployment.

Existing demo-only public forms remain unchanged.
