-- Development-only fictional case status history.
CREATE TABLE IF NOT EXISTS demo_case_status_events (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES client_cases(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_demo_case_status_events_case ON demo_case_status_events(case_id, created_at DESC);
CREATE TRIGGER IF NOT EXISTS trg_demo_case_status_history
AFTER UPDATE OF status ON client_cases
WHEN OLD.status <> NEW.status AND OLD.client_user_id = 'demo-fictional-client' AND OLD.title LIKE 'DEMO — %'
BEGIN
  INSERT INTO demo_case_status_events (id, case_id, previous_status, new_status)
  VALUES (lower(hex(randomblob(16))), NEW.id, OLD.status, NEW.status);
END;
