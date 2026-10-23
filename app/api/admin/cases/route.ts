import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAdminAccess } from "@/lib/server/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Statement = { bind(...values: unknown[]): Statement; all<T>(): Promise<{ results: T[] }> };
type Env = {
  DB?: { prepare(sql: string): Statement };
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_ADMIN_AUD?: string;
  ACCESS_ADMIN_EMAIL?: string;
};
type CaseRow = { id: string; title: string; status: string; created_at: string; updated_at: string };

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
    if (query.length > 100 || !/^[0-9]+$/.test(offsetText) || !Number.isSafeInteger(offset) || offset > 1000000) {
      return new Response(JSON.stringify({ error: "Invalid filters" }), { status: 400, headers });
    }
    const pattern = "%" + query.replace(/[\\%_]/g, "\\$&") + "%";
    const where = "deleted_at IS NULL AND title LIKE ? ESCAPE '\\'";
    const count = await config.DB.prepare("SELECT COUNT(*) AS total FROM client_cases WHERE " + where).bind(pattern).all<{ total: number }>();
    const rows = await config.DB.prepare(
      "SELECT id, title, status, created_at, updated_at FROM client_cases WHERE " + where +
      " ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET ?"
    ).bind(pattern, offset).all<CaseRow>();
    return new Response(JSON.stringify({ cases: rows.results, total: Number(count.results[0]?.total ?? 0), limit: 25, offset }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), { status: 503, headers });
  }
}
