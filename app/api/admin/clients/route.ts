import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAdminAccess } from "@/lib/server/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Statement = { bind(...values: unknown[]): Statement; all<T>(): Promise<{ results: T[] }>; run(): Promise<unknown> };
type Env = {
  DB?: { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown> };
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_ADMIN_AUD?: string;
  ACCESS_ADMIN_EMAIL?: string;
};
type ClientRow = { id: string; display_name: string; email: string | null; phone: string | null; status: string; created_at: string };

export async function GET(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
  try {
    const { env } = await getCloudflareContext();
    const config = env as unknown as Env;
    if (!config.ACCESS_TEAM_DOMAIN || !config.ACCESS_ADMIN_AUD || !config.ACCESS_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Admin API not configured" }), { status: 503, headers });
    }
    const authorized = await verifyAdminAccess(request.headers.get("cf-access-jwt-assertion"), {
      teamDomain: config.ACCESS_TEAM_DOMAIN,
      audience: config.ACCESS_ADMIN_AUD,
      adminEmail: config.ACCESS_ADMIN_EMAIL,
    });
    if (!authorized) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    if (!config.DB) return new Response(JSON.stringify({ error: "Database unavailable" }), { status: 503, headers });
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") ?? "").trim();
    const offsetText = params.get("offset") ?? "0";
    const offset = Number(offsetText);
    if (query.length > 100 || !/^\d+$/.test(offsetText) || !Number.isSafeInteger(offset) || offset > 1000000) {
      return new Response(JSON.stringify({ error: "Invalid filters" }), { status: 400, headers });
    }
    const pattern = "%" + query.replace(/[\\%_]/g, "\\$&") + "%";
    const where = "deleted_at IS NULL AND (display_name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')";
    const count = await config.DB.prepare("SELECT COUNT(*) AS total FROM crm_clients WHERE " + where).bind(pattern, pattern, pattern).all<{ total: number }>();
    const rows = await config.DB.prepare("SELECT id, display_name, email, phone, status, created_at FROM crm_clients WHERE " + where + " ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET ?").bind(pattern, pattern, pattern, offset).all<ClientRow>();
    return new Response(JSON.stringify({ clients: rows.results, total: Number(count.results[0]?.total ?? 0), limit: 25, offset }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), { status: 503, headers });
  }
}

/** Restricted CRM create: server-validated, same-origin, atomic audit. */
export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
  try {
    const origin = new URL(request.url).origin;
    if (request.headers.get("origin") !== origin ||
        !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid origin or content type" }), { status: 403, headers });
    }
    const length = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isFinite(length) || length > 4096) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 413, headers });
    }
    const { env } = await getCloudflareContext();
    const config = env as unknown as Env;
    if (!config.ACCESS_TEAM_DOMAIN || !config.ACCESS_ADMIN_AUD || !config.ACCESS_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Admin API not configured" }), { status: 503, headers });
    }
    const authorized = await verifyAdminAccess(request.headers.get("cf-access-jwt-assertion"), {
      teamDomain: config.ACCESS_TEAM_DOMAIN, audience: config.ACCESS_ADMIN_AUD, adminEmail: config.ACCESS_ADMIN_EMAIL,
    });
    if (!authorized) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    if (!config.DB) return new Response(JSON.stringify({ error: "Database unavailable" }), { status: 503, headers });
    const raw = await request.text();
    if (raw.length > 4096) return new Response(JSON.stringify({ error: "Request too large" }), { status: 413, headers });
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return new Response(JSON.stringify({ error: "Invalid client" }), { status: 400, headers });
    }
    const fields = data as Record<string, unknown>;
    if (Object.keys(fields).some(key => !["display_name", "email", "phone"].includes(key))) {
      return new Response(JSON.stringify({ error: "Unexpected fields" }), { status: 400, headers });
    }
    const name = typeof fields.display_name === "string" ? fields.display_name.trim() : "";
    const email = typeof fields.email === "string" ? fields.email.trim() : "";
    const phone = typeof fields.phone === "string" ? fields.phone.trim() : "";
    if (!name || name.length > 160 || email.length > 254 || phone.length > 40 ||
        (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
        (phone && !/^[+0-9() .-]{5,40}$/.test(phone))) {
      return new Response(JSON.stringify({ error: "Invalid client fields" }), { status: 400, headers });
    }
    const id = crypto.randomUUID();
    await config.DB.batch([
      config.DB.prepare("INSERT INTO crm_clients (id, display_name, email, phone) VALUES (?, ?, ?, ?)").bind(id, name, email || null, phone || null),
      config.DB.prepare("INSERT INTO crm_client_audit (id, client_id, action, actor_id) VALUES (?, ?, 'created', ?)").bind(crypto.randomUUID(), id, config.ACCESS_ADMIN_EMAIL.toLowerCase()),
    ]);
    return new Response(JSON.stringify({ id }), { status: 201, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Could not create client" }), { status: 503, headers });
  }
}
