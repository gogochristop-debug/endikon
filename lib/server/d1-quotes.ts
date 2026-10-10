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
