import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";

const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON; CREATE TABLE client_cases (id TEXT PRIMARY KEY NOT NULL);");
const migration = readFileSync(new URL("../migrations/0006_crm_foundation.sql", import.meta.url), "utf8");
db.exec(migration);
db.exec(migration); // migration is idempotent
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'crm_%' ORDER BY name").all().map(row => row.name);
assert.deepEqual(tables, ["crm_client_audit", "crm_client_case_links", "crm_clients"]);
const clientId = "fictional-client-1";
db.prepare("INSERT INTO crm_clients (id, display_name) VALUES (?, ?)").run(clientId, "DEMO Test Client");
assert.throws(() => db.prepare("INSERT INTO crm_clients (id, display_name) VALUES (?, ?)").run("invalid", " "));
assert.throws(() => db.prepare("INSERT INTO crm_clients (id, display_name, status) VALUES (?, ?, ?)").run("invalid", "DEMO", "unknown"));
assert.throws(() => db.prepare("INSERT INTO crm_client_case_links (case_id, client_id) VALUES (?, ?)").run("nonexistent", clientId));
db.prepare("INSERT INTO client_cases (id) VALUES (?)").run("fictional-case-1");
db.prepare("INSERT INTO crm_client_case_links (case_id, client_id) VALUES (?, ?)").run("fictional-case-1", clientId);
assert.throws(() => db.prepare("DELETE FROM crm_clients WHERE id = ?").run(clientId));
db.prepare("INSERT INTO crm_client_audit (id, client_id, action, actor_id) VALUES (?, ?, ?, ?)").run("audit-1", clientId, "created", "demo-admin");
assert.throws(() => db.prepare("INSERT INTO crm_client_audit (id, client_id, action, actor_id) VALUES (?, ?, ?, ?)").run("audit-2", clientId, "unknown", "demo-admin"));
console.log("CRM migration 0006 preflight passed (SQLite schema, idempotency, constraints, references).");
db.close();
