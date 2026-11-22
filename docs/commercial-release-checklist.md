# ENDIKON — Commercial release gates

Status: **NOT APPROVED FOR SALE OR LIVE CLIENT DATA**. This document distinguishes a deployable demo from a commercially supportable legal-services platform.

## Gate 1 — Infrastructure (mandatory)

- [ ] Verify Cloudflare production account ownership, deployment target, custom domain and rollback.
- [ ] Apply and verify D1 migrations (including `0006_crm_foundation.sql`) to the intended environment; take a tested backup first.
- [ ] After Cloudflare Access login, request `GET /api/admin/readiness`. A 200 with `ready: true` confirms only required table names and bindings, **not** production readiness.
- [ ] Verify R2 bucket access, private object policies, file size limits and deletion lifecycle.
- [ ] Configure separate development, staging and production databases, buckets and secrets. Current `wrangler.jsonc` uses `endikon-dev` and `endikon-documents-dev`: **do not sell this as an isolated production tenant**.
- [ ] Confirm automated deploy, health monitoring, backups, restore drill and incident alerting.

## Gate 2 — Product (mandatory)

- [ ] Replace demo login/registration with real identity lifecycle and account recovery.
- [ ] Implement authorization per client, case and document, including cross-tenant isolation.
- [ ] Implement real client-to-case association, lifecycle, search, status history and notifications.
- [ ] Implement private document upload/download, malware scanning, access logging and secure expiring links.
- [ ] Replace public demo quote forms with validated server-side submissions, abuse prevention and consent handling.
- [ ] Implement client portal using actual authenticated records rather than fictional examples.
- [ ] Complete accessibility, EL/EN content, browser/mobile, integration and acceptance testing.

## Gate 3 — Legal, privacy and security (mandatory)

- [ ] Establish data controller/processor roles and a GDPR Art. 28 processing agreement where applicable.
- [ ] Prepare privacy notice, retention/deletion policy, subject-rights procedure, breach-response procedure and subprocessor inventory.
- [ ] Assess DPIA necessity and legal professional confidentiality requirements with qualified counsel.
- [ ] Commission security review and penetration testing of Access, JWT, APIs, uploads, session handling, authorization and tenant boundaries.
- [ ] Set and test backup retention, recovery objectives, audit integrity and least-privilege access.
- [ ] Obtain customer-facing terms, support/SLA, pricing, invoicing and a signed acceptance checklist.

## Release rule

**No production PII, marketing as a production-ready legal case-management system, or paid customer onboarding until all three gates pass.** A green GitHub Actions run and a successful infrastructure preflight are necessary checks but insufficient evidence for commercial release.
