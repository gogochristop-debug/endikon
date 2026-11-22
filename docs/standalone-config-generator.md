# Standalone config generator (pre-provisioning)

Run from repository root after manually provisioning a **dedicated** D1 database, private R2 bucket and Cloudflare Access application for a customer.

```sh
node scripts/generate-standalone-config.mjs \
  --slug example-law \
  --database-id 11111111-2222-4333-8444-555555555555 \
  --database-name endikon-example-law \
  --bucket endikon-example-law-documents \
  --domain https://legal.example.org \
  --access-aud EXAMPLE_AUDIENCE_REPLACE_ME \
  --dry-run
```

Remove `--dry-run` to create an untracked `.standalone/example-law.wrangler.json`. This example uses placeholders, not deployable resources.

**Safety boundaries:** the script does not call Cloudflare, create resources, apply migrations, configure Access, install secrets or deploy. It rejects known development database/bucket IDs, invalid slugs and existing output files; generated configs are gitignored. A separately verified production deployment process is still required.

Before production use, independently verify the Access AUD and administrator allowlist, set `ACCESS_TEAM_DOMAIN`, `ACCESS_ADMIN_AUD`, `ACCESS_ADMIN_EMAIL`, `ENDIKON_FIRM_NAME` and `ENDIKON_PUBLIC_URL` as installation-specific settings using secure Cloudflare configuration. Check the dedicated D1 migration status, R2 privacy, backups, legal/privacy requirements and release acceptance tests. Never use placeholder UUIDs or audiences for real clients.

The `--access-aud` input is validated but deliberately **not written into the generated config**; configure it as a secret through your protected deployment process.
