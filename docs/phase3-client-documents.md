# ENDIKON — secure client case files (Phase 3)

## Intended client journey
1. A verified client account is invited to a specific case by the firm.
2. The firm creates a checklist of required documents for that case.
3. The client can view **only cases assigned to their verified identity**.
4. Each upload is validated server-side, quarantined, scanned, and recorded as metadata in D1; file bytes reside in a **private** Cloudflare R2 bucket.
5. The firm reviews each document, accepts it or requests resubmission; the client sees the status.
6. Each view, download, decision and deletion is auditable.

## Architecture and security gates
- Use a dedicated private R2 bucket. No public bucket URLs or anonymous object access.
- Never treat a case ID supplied by a client as authorization. Authenticate the session and resolve ownership in D1 on **every** request.
- Admin authorization must be verified by server-side Cloudflare Access JWT. Client login needs its own secure identity provider and session handling.
- Limit files to 10 MiB initially; allow PDF, JPEG, PNG and DOCX only. Verify **actual file signatures** and ZIP container content (DOCX), not just browser MIME or extension.
- Scan uploaded content for malware before release. Quarantine pending scan. Disallow active HTML/SVG, executables, macro-enabled documents, and untrusted archives.
- Defend against CSRF, replay, abusive upload rates, oversized request bodies, insecure direct object references and cross-user access.
- Use server-generated opaque R2 object keys. Keep original filenames only as private D1 metadata.
- Use short-lived signed download or authenticated streaming with Content-Disposition: attachment and no-store. Never expose R2 credentials in the browser.
- Encrypt in transit and at rest, restrict access to least privilege, and log administrative access without logging file contents.
- Define consent/legal basis, privacy notice, retention/deletion schedule, data subject access procedures and backups with the law firm before production.
- Apply migration to **endikon-dev** only after review; production must have separate D1 and R2 resources.
- No real uploads or personal data until end-to-end access control, scanning, privacy and recovery tests pass.

## Current status
This PR contains **schema and validation foundations only**. It does NOT provide registration, client authentication, uploads, R2 bucket creation, document download or any exposed API endpoint.
