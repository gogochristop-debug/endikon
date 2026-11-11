import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAdminAccess } from "@/lib/server/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Statement = { bind(...values: unknown[]): Statement; all<T>(): Promise<{ results: T[] }> };
type Env = {
  DB?: { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown> };
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_ADMIN_AUD?: string;
  ACCESS_ADMIN_EMAIL?: string;
};
const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
const reply = (error: string, status: number) => new Response(JSON.stringify({ error }), { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin ||
      !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply("Invalid origin or content type", 403);
  const length = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(length) || length > 4096) return reply("Request too large", 413);
  try {
    const { env } = await getCloudflareContext();
    const config = env as unknown as Env;
    if (!config.ACCESS_TEAM_DOMAIN || !config.ACCESS_ADMIN_AUD || !config.ACCESS_ADMIN_EMAIL) return reply("Admin API not configured", 503);
    const authorized = await verifyAdminAccess(request.headers.get("cf-access-jwt-assertion"), {
      teamDomain: config.ACCESS_TEAM_DOMAIN, audience: config.ACCESS_ADMIN_AUD, adminEmail: config.ACCESS_ADMIN_EMAIL,
    });
    if (!authorized) return reply("Unauthorized", 401);
    if (!config.DB) return reply("Database unavailable", 503);
    const { id } = await context.params;
    if (!uuid.test(id)) return reply("Invalid client ID", 400);
    const raw = await request.text();
    if (raw.length > 4096) return reply("Request too large", 413);
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { return reply("Invalid JSON", 400); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return reply("Invalid client", 400);
    const fields = payload as Record<string, unknown>;
    if (Object.keys(fields).length !== 4 ||
        !["display_name", "email", "phone", "updated_at"].every(key => Object.hasOwn(fields, key))) return reply("Invalid client fields", 400);
    if (typeof fields.display_name !== "string" || typeof fields.email !== "string" ||
        typeof fields.phone !== "string" || typeof fields.updated_at !== "string") return reply("Invalid field types", 400);
    const name = fields.display_name.trim();
    const email = fields.email.trim();
    const phone = fields.phone.trim();
    const updatedAt = fields.updated_at;
    if (!name || name.length > 160 || email.length > 254 || phone.length > 40 ||
        (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
        (phone && !/^[+0-9() .-]{5,40}$/.test(phone)) ||
        updatedAt.length > 40 || !/^\d{4}-\d{2}-\d{2}T/.test(updatedAt)) return reply("Invalid client fields", 400);
    const existing = await config.DB.prepare("SELECT id, updated_at FROM crm_clients WHERE id = ? AND deleted_at IS NULL").bind(id).all<{ id: string; updated_at: string }>();
    if (!existing.results.length) return reply("Client not found", 404);
    if (existing.results[0].updated_at !== updatedAt) return reply("Client modified by another session", 409);
    // D1 batch is transactional; the audit row and update commit together.
    // A conditional update prevents stale edits; audit is inserted only when UPDATE changed one row.
    const nextVersion = new Date().toISOString() + "-" + crypto.randomUUID();
    // Unique revision token supports optimistic concurrency without a schema migration.
    // The write and audit are grouped; an additional existence check is needed for a racing edit.
    await config.DB.batch([
      config.DB.prepare("UPDATE crm_clients SET display_name = ?, email = ?, phone = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND deleted_at IS NULL").bind(name, email || null, phone || null, nextVersion, id, updatedAt),
      config.DB.prepare("INSERT INTO crm_client_audit (id, client_id, action, actor_id) SELECT ?, ?, 'updated', ? WHERE changes() = 1").bind(crypto.randomUUID(), id, config.ACCESS_ADMIN_EMAIL.toLowerCase()),
    ]);
    const refreshed = await config.DB.prepare("SELECT id, display_name, email, phone, status, created_at, updated_at FROM crm_clients WHERE id = ? AND deleted_at IS NULL").bind(id).all();
    if (!refreshed.results.length) return reply("Client not found", 404);
    if ((refreshed.results[0] as { updated_at: string }).updated_at !== nextVersion) return reply("Client modified by another session", 409);
    return new Response(JSON.stringify({ client: refreshed.results[0] }), { status: 200, headers });
  } catch {
    return reply("Could not update client", 503);
  }
}
