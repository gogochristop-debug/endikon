import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAdminAccess } from "@/lib/server/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Statement = { bind(...values: unknown[]): Statement; all<T>(): Promise<{ results: T[] }>; run(): Promise<unknown> };
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
    const caseId = params.get("id");
    if (caseId !== null) {
      if (!/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(caseId)) {
        return new Response(JSON.stringify({ error: "Invalid case ID" }), { status: 400, headers });
      }
      const selected = await config.DB.prepare(
        "SELECT id, title, status, created_at, updated_at FROM client_cases WHERE id = ? AND client_user_id = ? AND deleted_at IS NULL"
      ).bind(caseId, "demo-fictional-client").all<CaseRow>();
      const item = selected.results[0];
      if (!item) return new Response(JSON.stringify({ error: "Demo case not found" }), { status: 404, headers });
      const requirements = await config.DB.prepare(
        "SELECT id, label, description, required, sort_order FROM case_document_requirements WHERE case_id = ? ORDER BY sort_order, id"
      ).bind(caseId).all<{ id: string; label: string; description: string | null; required: number; sort_order: number }>();
      return new Response(JSON.stringify({ case: item, requirements: requirements.results }), { status: 200, headers });
    }
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

/**
 * Phase 3 demo-only case creation. Fixed fictional templates prevent accidental
 * storage of real client details before the production security review.
 */
const DEMO_TEMPLATES = {
  debt: "DEMO — Ρύθμιση οφειλών (εικονική υπόθεση)",
  immigration: "DEMO — Άδεια διαμονής (εικονική υπόθεση)",
  property: "DEMO — Έλεγχος ακινήτου (εικονική υπόθεση)",
} as const;

export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
  try {
    const url = new URL(request.url);
    // A valid Access session alone is insufficient to prevent cross-site writes.
    if (request.headers.get("origin") !== url.origin ||
        !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid request origin or content type" }), { status: 403, headers });
    }
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
    const length = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isFinite(length) || length > 1024) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 413, headers });
    }
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).length !== 1 || !("template" in body) ||
        typeof body.template !== "string" ||
        !Object.prototype.hasOwnProperty.call(DEMO_TEMPLATES, body.template)) {
      return new Response(JSON.stringify({ error: "Invalid demo template" }), { status: 400, headers });
    }
    const template = body.template as keyof typeof DEMO_TEMPLATES;
    const id = crypto.randomUUID();
    await config.DB.prepare(
      "INSERT INTO client_cases (id, client_user_id, title, status) VALUES (?, ?, ?, 'open')"
    ).bind(id, "demo-fictional-client", DEMO_TEMPLATES[template]).run();
    return new Response(JSON.stringify({ id, title: DEMO_TEMPLATES[template], status: "open" }), { status: 201, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Could not create demo case" }), { status: 503, headers });
  }
}

const DEMO_STATUSES = ["open", "waiting_documents", "in_review", "completed", "archived"] as const;

export async function PATCH(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin ||
        !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid request origin or content type" }), { status: 403, headers });
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
    if (Number(request.headers.get("content-length") ?? "0") > 1024) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 413, headers });
    }
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).sort().join(",") !== "id,status" ||
        !("id" in body) || typeof body.id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(body.id) ||
        !("status" in body) || typeof body.status !== "string" ||
        !DEMO_STATUSES.some(status => status === body.status)) {
      return new Response(JSON.stringify({ error: "Invalid case status request" }), { status: 400, headers });
    }
    const id = body.id as string;
    const status = body.status as string;
    const result = await config.DB.prepare(
      "UPDATE client_cases SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND client_user_id = ? AND deleted_at IS NULL"
    ).bind(status, id, "demo-fictional-client").run() as { meta?: { changes?: number } };
    if (!result.meta?.changes) return new Response(JSON.stringify({ error: "Demo case not found" }), { status: 404, headers });
    return new Response(JSON.stringify({ id, status }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Could not update demo case" }), { status: 503, headers });
  }
}
