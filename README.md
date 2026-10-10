# ENDIKON — Phase 1

A bilingual Greek/English legal services frontend prototype built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 and Lucide icons. Greek is the default at `/`. Warm neutral surfaces, editorial serif headings, teal accents, and a CSS architectural illustration form the visual identity. No remote fonts or images are required.

## Development

Use Node.js 22+ (validated on Node 24.19.0) and npm. From this existing checkout:

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

## Cloudflare Workers (OpenNext)

This targets **Cloudflare Workers**, not Pages or a static export. Dynamic App Router routes, locale switching, query parameters and demo dashboards run through the Worker. `next.config.ts` enables local Cloudflare bindings; `open-next.config.ts` uses the supported default adapter. Website code and behavior are unchanged.

Versions are locked: Next.js / eslint-config-next **16.3.8**, `@opennextjs/cloudflare` **1.20.10**, Wrangler **4.149.0**. Next.js is deliberately pinned: 16.4.0 built successfully with this adapter but failed in workerd on `Unexpected loadManifest(/.next/server/preview-props.json) call!`. The pinned combination passes all 44 routes in workerd. Revalidate the Worker runtime before upgrading Next.js or the adapter.

From the repository root, install with `npm ci` (include development dependencies). For a Cloudflare Workers Builds Git integration, use:

| Setting | Value |
| --- | --- |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |
| Root directory | Repository root |
| Node version | 24.19.0 recommended, 22+ required; set `NODE_VERSION=24.19.0` if the build platform needs an override |

The build command runs the ordinary Next.js production build and adapts it into `.open-next/worker.js` and `.open-next/assets`. The deploy command uploads that existing output. **Deployment has not been run.** Do not execute the deploy command until deployment is authorized. No custom domain or route is configured.

`wrangler.jsonc` declares:

- Worker name `endikon` and entry point `.open-next/worker.js`.
- Compatibility date **2026-10-09**, with **`nodejs_compat`** and **`global_fetch_strictly_public`**. OpenNext requires Node compatibility; retain this tested date and flags together.
- Static assets binding **`ASSETS`** for `.open-next/assets`.
- Self-reference service binding **`WORKER_SELF_REFERENCE`**, with service name `endikon`. If renaming the Worker, change both names together.

Phase 1 needs no application environment variables, Supabase credentials, R2 bucket, KV namespace, database, image binding or external service. No cache persistence is required by its current dynamic/demo routes. For eventual deployment from external CI, supply `CLOUDFLARE_API_TOKEN` (scoped Workers deployment permissions) and `CLOUDFLARE_ACCOUNT_ID` securely; neither is needed for local build/preview, and neither belongs in `.env.example` or Git. Cloudflare's native Git build integration supplies deployment authentication through its platform.

Local validation without publishing:

```sh
npm run typegen:cloudflare
npm run lint
npm run typecheck
npm run build:cloudflare
npm run check:cloudflare       # Wrangler deploy --dry-run; does not deploy
npm run preview:cloudflare -- --port 8787
# In another terminal:
npm run smoke:cloudflare
```

Generated runtime types, `.open-next`, `.wrangler` and `.dev.vars*` are ignored. Regenerate types after changing bindings. On a sandbox where the home configuration directory is read-only, prefix Wrangler/OpenNext commands with `XDG_CONFIG_HOME=/tmp/endikon-config WRANGLER_LOG_PATH=/tmp/endikon-wrangler.log`; these are local tooling overrides, not production application requirements.

Validated: lint, TypeScript, Next.js production build, OpenNext build, Wrangler binding type generation, dry-run bundle checks and all 44 localized routes under local workerd. Smoke checks also exercise redirects, 404s, static CSS/JS assets, favicon and quote query preselection. Local preview may warn that `Request.cf` metadata could not be fetched behind a restricted proxy; it uses placeholder metadata, and the application does not depend on it. A Chromium walkthrough also verified client-side navigation/hydration, locale switching, service-to-quote selection, form previews, admin search and mobile navigation on workerd without browser or server errors. No live Cloudflare deployment or custom domain has been tested or configured.

## Typography and readability

The shared stylesheet uses the same rem scale for Greek and English: 18–19px reading text, 16–17px navigation, 16px controls and action links, and 14px labels/metadata at the default browser font size. Existing serif hero headings, fonts, and brand color values are preserved. Ink replaces low-contrast muted text on pale surfaces. Reading line-height is 1.75; form controls have a 48px minimum height and primary actions a 44px minimum height.

Navigation switches to the existing menu at 1200px to accommodate longer Greek labels. Dashboard statistics stack below 1000px; dashboard tables and mobile sidebar navigation scroll within their containers. Mobile headings, wrapping, and flexible grid children keep narrow screens and enlarged text usable.

Validated on the production build with headless Chromium: all 44 localized routes at 320, 375, 768, 1024, 1200, 1280 and 1440px (308 checks), minimum text sizes, viewport overflow, desktop header overlap, mobile navigation, quote selection through locale switching, form feedback, admin search/actions, upload preview, and 200% text enlargement on representative Greek home/form/portal/admin pages. Screenshots reviewed at mobile, tablet and desktop widths. Lint, typecheck, and route smoke checks pass. In the managed environment, the default Turbopack build could not bind its CSS compiler port; `npm run build -- --webpack` passed using Next.js's supported webpack compiler.
