-- ENDIKON Phase 2: initial private quote intake schema for Cloudflare D1.
-- Schema only. No database binding or public API is enabled by this migration.
-- Apply to a dedicated development database first; never store real client data in preview.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK(length(email) BETWEEN 3 AND 150),
  phone TEXT CHECK(phone IS NULL OR length(phone) <= 30),
  service TEXT NOT NULL CHECK(length(service) BETWEEN 1 AND 100),
  matter_type TEXT CHECK(matter_type IS NULL OR length(matter_type) <= 120),
  details TEXT NOT NULL CHECK(length(details) BETWEEN 1 AND 2000),
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK(status IN ('received','review','awaiting_client','quoted','closed')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status_created
  ON quote_requests(status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS quote_status_events (
  id TEXT PRIMARY KEY NOT NULL,
  quote_request_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  from_status TEXT,
  to_status TEXT NOT NULL
    CHECK(to_status IN ('received','review','awaiting_client','quoted','closed')),
  actor_id TEXT NOT NULL,
  FOREIGN KEY (quote_request_id) REFERENCES quote_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_status_events_request
  ON quote_status_events(quote_request_id, created_at DESC);
