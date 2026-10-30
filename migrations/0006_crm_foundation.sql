-- CRM foundation: additive schema, not automatically applied.
CREATE TABLE IF NOT EXISTS crm_clients (
 id TEXT PRIMARY KEY NOT NULL,
 display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 160),
 email TEXT,
 phone TEXT,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_crm_clients_name ON crm_clients(deleted_at,display_name COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS crm_client_case_links (
 case_id TEXT PRIMARY KEY NOT NULL REFERENCES client_cases(id) ON DELETE CASCADE,
 client_id TEXT NOT NULL REFERENCES crm_clients(id) ON DELETE RESTRICT,
 linked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_crm_client_case_links_client ON crm_client_case_links(client_id);
CREATE TABLE IF NOT EXISTS crm_client_audit (
 id TEXT PRIMARY KEY NOT NULL,
 client_id TEXT NOT NULL REFERENCES crm_clients(id) ON DELETE RESTRICT,
 action TEXT NOT NULL CHECK(action IN ('created','updated','deactivated','linked_case','unlinked_case')),
 actor_id TEXT NOT NULL,
 occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_crm_client_audit ON crm_client_audit(client_id,occurred_at DESC);
