#!/usr/bin/env node
/**
 * Generates an isolated Wrangler config for a single firm. Does not provision
 * Cloudflare resources, apply migrations, deploy, or manage secrets.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    slug: { type: "string" },
    "database-id": { type: "string" },
    "database-name": { type: "string" },
    bucket: { type: "string" },
    domain: { type: "string" },
    "access-aud": { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});
function fail(message) { console.error("Error: " + message); process.exit(1); }
const slug = values.slug;
if (!slug || !/^[a-z][a-z0-9-]{2,39}$/.test(slug) || slug.endsWith("-") || slug.includes("--") || slug === "dev" || slug === "demo") fail("Provide a safe unique customer slug (3–40 lowercase letters, digits or hyphens).");
const dbId = values["database-id"];
if (!dbId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbId) || dbId === "cdf95f72-43fa-4d9d-bbfe-8b73ec3a3011") fail("Provide a dedicated non-development D1 database UUID.");
const dbName = values["database-name"];
const bucket = values.bucket;
if (!dbName || !/^endikon-[a-z0-9-]{3,48}$/.test(dbName) || dbName === "endikon-dev") fail("Provide a dedicated D1 database name beginning endikon-.");
if (!bucket || !/^endikon-[a-z0-9-]{3,48}$/.test(bucket) || bucket === "endikon-documents-dev") fail("Provide a dedicated R2 bucket name beginning endikon-.");
const domain = values.domain;
let hostname;
try {
  const url = new URL(domain);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || !url.hostname.includes(".")) throw Error();
  hostname = url.hostname;
} catch { fail("Provide an HTTPS domain origin, e.g. https://legal.example.com"); }
if (!values["access-aud"] || !/^[a-zA-Z0-9_-]{12,256}$/.test(values["access-aud"])) fail("Provide the dedicated Cloudflare Access application AUD.");
const template = readFileSync(resolve("wrangler.jsonc"), "utf8");
const config = JSON.parse(template.replace(/^\s*\/\/.*$/gm, ""));
config.name = `endikon-${slug}`;
config.d1_databases = [{ binding: "DB", database_name: dbName, database_id: dbId }];
config.r2_buckets = [{ binding: "DOCUMENTS_BUCKET", bucket_name: bucket }];
delete config.previews; // no accidental development preview resources
config.services = [{ binding: "WORKER_SELF_REFERENCE", service: config.name }];
config.routes = [{ pattern: hostname, custom_domain: true }];
// Secrets and admin emails are intentionally NOT written to disk.
const targetDir = resolve(".standalone");
const target = join(targetDir, `${slug}.wrangler.json`);
if (existsSync(target)) fail("Configuration already exists; refusing to overwrite.");
if (values["dry-run"]) {
  console.log(JSON.stringify({ worker: config.name, database: dbName, bucket, hostname, accessAudienceConfigured: true, target, dryRun: true }, null, 2));
} else {
  mkdirSync(targetDir, { recursive: true, mode: 0o700 });
  writeFileSync(target, JSON.stringify(config, null, 2) + "\n", { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log("Created isolated config at " + target);
  console.log("Next: provision unique Access policy and secrets; verify ownership and migrations before any deployment.");
}
