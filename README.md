# ENDIKON — Phase 1

A bilingual Greek/English legal services frontend prototype built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 and Lucide icons. Greek is the default at `/`. Warm neutral surfaces, editorial serif headings, teal accents, and a CSS architectural illustration form the visual identity. No remote fonts or images are required.

## Development

Use Node.js 20.9+ (validated on Node 24) and npm. From this existing checkout:

```sh
npm ci
npm run dev
```

Validation and production:

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

If your npm home cache is not writable, append `--cache /tmp/endikon-npm` to `npm ci`. No environment variables are needed. `.env.example` documents future integration configuration.

## Routes and architecture

Every page is available under `/el` and `/en`. Navigation preserves the current route when switching language. `lib/content.ts` contains structured bilingual UI copy, service descriptions and tailored matter types. `components/website.tsx` supplies responsive shared navigation, service cards, forms and dashboard components. App Router handles locale validation, 404s and localized SEO metadata; demo dashboards are marked noindex.

Public routes: locale home, `/services`, `/about`, `/contact`, `/quote`, `/login`, `/register`. Six service detail routes: `/services/debt-settlement`, `/services/immigration`, `/services/real-estate`, `/services/inheritance`, `/services/family-law`, `/services/other`. Each includes a tailored request form and quote link with service preselection.

Client demo: `/portal`, `/portal/cases`, `/portal/documents`, `/portal/messages`, `/portal/notifications`. Includes case timelines, document checklist, disabled upload preview, messages, notifications and quote review status.

Admin demo: `/admin`, `/admin/clients`, `/admin/cases`, `/admin/quotes`. Includes fictional searchable clients/requests, case statuses, document request previews and a quote preparation preview. Actions deliberately do not persist.

## Prototype boundaries and future backend

All cases and identities are fictional. Forms validate fields locally and display a demo acknowledgement; they make no network requests and store nothing. Do not enter real personal data. There are no file inputs, document uploads, payments, accounts, authentication, cookies, localStorage or production integrations. Login/Register explain the demo and link to public demonstration dashboards. No professional credentials, outcomes or public prices are asserted.

`lib/backend.ts` is a typed integration boundary, disabled in Phase 1. A production Supabase integration must add server-validated inputs, real authentication, case/document authorization with row-level security, private storage with expiring signed URLs, audit trails, retention policies and abuse protection. Never place service-role keys in public variables. Credentials must be supplied securely outside Git.

The environment already provides an isolated checkout; do not create a worktree for ordinary development. Restart `npm run dev` or `npm start` when beginning a new task; processes do not survive environment snapshots.

## Verified checks

Lint, TypeScript and production build pass. `npm run smoke` (with the app running) checks 44 localized routes, HTML language, headings, demo noindex metadata, absence of file inputs, unknown route 404s and the Greek default redirect.

A headless Chromium walkthrough also verified EL/EN switching with quote selection preserved, service preselection, form acknowledgement, disabled upload preview, admin search and actions, mobile menu, mobile overflow and absence of browser errors or mutation requests. Screenshots were inspected at desktop and mobile widths. Authentication and production integrations are intentionally unimplemented.
