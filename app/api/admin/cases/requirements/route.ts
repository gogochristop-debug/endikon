import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAdminAccess } from "@/lib/server/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Statement = {
  bind(...values: unknown[]): Statement;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
};
type Env = {
  DB?: { prepare(sql: string): Statement };
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_ADMIN_AUD?: string;
  ACCESS_ADMIN_EMAIL?: string;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i;
const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };

export async function POST(request: Request): Promise<Response> {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin ||
        !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 403, headers });
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
    const length = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isFinite(length) || length > 1024) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 413, headers });
    }
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).sort().join(",") !== "caseId,label,required" ||
        !("caseId" in body) || typeof body.caseId !== "string" || !uuid.test(body.caseId) ||
        !("label" in body) || typeof body.label !== "string" ||
        !("required" in body) || typeof body.required !== "boolean") {
      return new Response(JSON.stringify({ error: "Invalid requirement" }), { status: 400, headers });
    }
    const caseId = body.caseId as string;
    const label = (body.label as string).trim();
    const required = body.required as boolean;
    if (!label || label.length > 120 || /[<>\u0000-\u001f]/.test(label) || !label.startsWith("DEMO — ")) {
      return new Response(JSON.stringify({ error: "Fictional DEMO label required" }), { status: 400, headers });
    }
    const cases = await config.DB.prepare(
      "SELECT id FROM client_cases WHERE id = ? AND client_user_id = ? AND title LIKE 'DEMO — %' AND deleted_at IS NULL"
    ).bind(caseId, "demo-fictional-client").all<{ id: string }>();
    if (!cases.results.length) return new Response(JSON.stringify({ error: "Demo case not found" }), { status: 404, headers });
    const existing = await config.DB.prepare(
      "SELECT id FROM case_document_requirements WHERE case_id = ? AND label = ?"
    ).bind(caseId, label).all<{ id: string }>();
    if (existing.results.length) return new Response(JSON.stringify({ error: "Requirement already exists" }), { status: 409, headers });
    const count = await config.DB.prepare(
      "SELECT COUNT(*) AS total, COALESCE(MAX(sort_order), -1) AS last_order FROM case_document_requirements WHERE case_id = ?"
    ).bind(caseId).all<{ total: number; last_order: number }>();
    const stats = count.results[0];
    if (Number(stats?.total ?? 0) >= 30) {
      return new Response(JSON.stringify({ error: "Checklist limit reached" }), { status: 409, headers });
    }
    const id = crypto.randomUUID();
    await config.DB.prepare(
      "INSERT INTO case_document_requirements (id, case_id, label, required, sort_order) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, caseId, label, required ? 1 : 0, Number(stats?.last_order ?? -1) + 1).run();
    return new Response(JSON.stringify({ id, label, required }), { status: 201, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Could not add demo requirement" }), { status: 503, headers });
  }
}
