/** Server-only D1 access for ENDIKON. Never import into client components. */
import "server-only";

export type QuoteRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  service: string;
  status: "received" | "review" | "awaiting_client" | "quoted" | "closed";
};

type Statement = {
  bind(...values: unknown[]): Statement;
  all<T>(): Promise<{ results: T[] }>;
};
type Database = { prepare(sql: string): Statement };

/** Caller MUST authenticate and authorize before invoking this function. */
export async function listQuotesForAuthorizedAdmin(
  db: Database,
  limit = 25,
): Promise<QuoteRow[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Invalid pagination limit");
  }
  const { results } = await db.prepare(
    "SELECT id, created_at, name, email, service, status FROM quote_requests WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?",
  ).bind(limit).all<QuoteRow>();
  return results;
}

export const QUOTE_STATUSES = ["received", "review", "awaiting_client", "quoted", "closed"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return typeof value === "string" && QUOTE_STATUSES.some(status => status === value);
}

type MutationStatement = {
  bind(...values: unknown[]): MutationStatement;
};
type MutationDatabase = { prepare(sql: string): MutationStatement; batch(statements: MutationStatement[]): Promise<unknown> };

/**
 * Safe server-side status update: an UPDATE guarded by the expected prior status,
 * followed by an audit event. This helper must only be invoked after verified admin
 * authorization and request-origin/CSRF checks in a future API route.
 *
 * D1 batch is transactional; conditional event insertion only records successful
 * updates. A stale request does not overwrite another administrator's change.
 */
export async function changeQuoteStatusForAuthorizedAdmin(
  db: MutationDatabase,
  input: { quoteId: string; fromStatus: QuoteStatus; toStatus: QuoteStatus; actorId: string },
): Promise<"updated" | "unchanged"> {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(input.quoteId) ||
      !isQuoteStatus(input.fromStatus) || !isQuoteStatus(input.toStatus) ||
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(input.actorId) ||
      input.actorId.length > 150) throw new Error("Invalid status update");
  if (input.fromStatus === input.toStatus) return "unchanged";
  const eventId = crypto.randomUUID();
  // SQLite changes() observes the immediately preceding UPDATE within the same
  // D1 batch transaction; the audit insert is skipped when the UPDATE changed 0 rows.
  await db.batch([
    db.prepare(
      "UPDATE quote_requests SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = ? AND deleted_at IS NULL"
    ).bind(input.toStatus, input.quoteId, input.fromStatus),
    db.prepare(
      "INSERT INTO quote_status_events (id, quote_request_id, from_status, to_status, actor_id) SELECT ?, ?, ?, ?, ? WHERE changes() = 1"
    ).bind(eventId, input.quoteId, input.fromStatus, input.toStatus, input.actorId),
  ]);
  return "updated";
}
