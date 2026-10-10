# Quote API rollout — not enabled

The endpoint `POST /api/quote-requests` is a **disabled scaffold**. It always responds with HTTP 503 because `QUOTE_INTAKE_ENABLED` is false.

It includes JSON and size checks, a same-origin check, validation against canonical service slugs, and a prepared D1 insert. These controls **are not sufficient** to enable real client submissions.

Before enabling: configure a production-specific D1 database, verify migrations, implement rate limiting and anti-bot protection, create privacy/retention documentation, ensure secure authenticated admin read/update access, add integration tests and perform a security review. No public endpoint may read personal data without authorization.

The existing forms and admin UI are demonstrations and remain unconnected. Do not change the feature flag as a shortcut.
