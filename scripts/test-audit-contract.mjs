import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("migrations/0003_demo_case_status_history.sql");
const casesRoute = read("app/api/admin/cases/route.ts");

test("demo audit migration defines table, index and status trigger", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS demo_case_status_events\b/i);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_demo_case_status_events_case\b/i);
  assert.match(migration, /CREATE TRIGGER IF NOT EXISTS trg_demo_case_status_history\b/i);
  assert.match(migration, /AFTER UPDATE OF status ON client_cases/i);
  assert.match(migration, /OLD\.status\s*<>\s*NEW\.status/);
});

test("audit trigger only records fictional DEMO cases", () => {
  assert.match(migration, /OLD\.client_user_id\s*=\s*'demo-fictional-client'/);
  assert.match(migration, /OLD\.title LIKE 'DEMO — %'/);
  assert.match(migration, /INSERT INTO demo_case_status_events/i);
});

test("status writes fail closed if table or trigger is absent", () => {
  const patch = casesRoute.slice(casesRoute.indexOf("export async function PATCH"));
  assert.match(patch, /sqlite_master/);
  assert.match(patch, /demo_case_status_events/);
  assert.match(patch, /trg_demo_case_status_history/);
  assert.match(patch, /status:\s*503/);
  assert.ok(patch.indexOf("sqlite_master") < patch.indexOf("UPDATE client_cases SET status"));
});

test("case detail exposes history readiness and limits audit records", () => {
  const get = casesRoute.slice(casesRoute.indexOf("export async function GET"), casesRoute.indexOf("export async function POST"));
  assert.match(get, /historyAvailable/);
  assert.match(get, /FROM demo_case_status_events/);
  assert.match(get, /LIMIT 30/);
  assert.match(get, /client_user_id = \?/);
});

test("status writes only target fictional cases and skip unchanged status", () => {
  const patch = casesRoute.slice(casesRoute.indexOf("export async function PATCH"));
  assert.match(patch, /UPDATE client_cases SET status[\s\S]*?title LIKE 'DEMO — %'/);
  assert.match(patch, /AND status <> \?/);
  assert.match(patch, /unchanged:\s*true/);
  assert.match(patch, /SELECT status FROM client_cases WHERE id = \?/);
});
