-- ENDIKON Phase 3: case/document metadata only.
-- Apply to DEVELOPMENT D1 only. No uploads, public routes, or personal data enabled.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS client_cases (
  id TEXT PRIMARY KEY NOT NULL,
  client_user_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 160),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','waiting_documents','in_review','completed','archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_client_cases_owner ON client_cases(client_user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS case_document_requirements (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES client_cases(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK(length(label) BETWEEN 1 AND 160),
  description TEXT CHECK(description IS NULL OR length(description) <= 500),
  required INTEGER NOT NULL DEFAULT 1 CHECK(required IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_case_requirements_case ON case_document_requirements(case_id, sort_order);

CREATE TABLE IF NOT EXISTS case_documents (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES client_cases(id) ON DELETE CASCADE,
  requirement_id TEXT REFERENCES case_document_requirements(id) ON DELETE SET NULL,
  uploader_user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL CHECK(length(original_filename) BETWEEN 1 AND 255),
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK(byte_size > 0 AND byte_size <= 10485760),
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','accepted','resubmit_requested','quarantined')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_case_documents_case ON case_documents(case_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS case_document_events (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES case_documents(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('uploaded','viewed','downloaded','accepted','resubmit_requested','quarantined','deleted')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_case_document_events_doc ON case_document_events(document_id, created_at DESC);
