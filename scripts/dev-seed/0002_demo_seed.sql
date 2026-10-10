-- ENDIKON development-only synthetic records.
-- Execute ONLY against endikon-dev after verifying database selection.
-- These are invented placeholders, not personal information.
INSERT OR IGNORE INTO quote_requests
(id, name, email, phone, service, matter_type, details, consent_at, status)
VALUES
('demo-quote-001', 'Demo Client One', 'demo-one@example.invalid', NULL, 'demo', 'demo', 'Synthetic test request. No legal case information.', '2026-10-10T00:00:00Z', 'received'),
('demo-quote-002', 'Demo Client Two', 'demo-two@example.invalid', NULL, 'demo', 'demo', 'Synthetic test request for status display.', '2026-10-10T00:00:00Z', 'review');
