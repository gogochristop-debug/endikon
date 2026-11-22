# Standalone branding — initial phase

Each law firm must have its own isolated Cloudflare deployment, D1 database, R2 bucket and Access configuration. This phase only adds **public name and metadata configuration**; it does not provision resources or change security boundaries.

Configure these server-side environment variables per installation:

| Variable | Example | Behavior |
| --- | --- | --- |
| `ENDIKON_FIRM_NAME` | `Example Legal Office` | Site title and text header (instead of ENDIKON logo) |
| `ENDIKON_PUBLIC_URL` | `https://law.example.org` | Metadata base URL; must be HTTPS |
| `ENDIKON_CONTACT_EMAIL` | `office@example.org` | Validated server-side for future contact features; **not displayed or used yet** |

Unset values retain the current ENDIKON name and URL for compatibility with development. The ENDIKON logo appears only for the default brand. Custom names are displayed as text; custom logo uploads, contact display, service configuration and theme controls are **not implemented**.

**Before deploying for a paying client:** complete the commercial release gates in `docs/commercial-release-checklist.md` and per-installation isolation in `docs/standalone-deployment.md`. The fallback `https://endikon.com` is a development default, not a verified customer domain. Never put real client data into the current demo.
