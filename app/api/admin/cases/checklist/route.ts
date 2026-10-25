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

const CHECKLISTS = {
  debt: ["Ταυτότητα (DEMO)", "Κατάσταση οφειλών (DEMO)", "Εισοδηματικά στοιχεία (DEMO)"],
  immigration: ["Ταξιδιωτικό έγγραφο (DEMO)", "Αποδεικτικό διαμονής (DEMO)", "Ασφαλιστική κάλυψη (DEMO)"],
  property: ["Τίτλος ιδιοκτησίας (DEMO)", "Κτηματολογικά στοιχεία (DEMO)", "Στοιχεία ακινήτου (DEMO)"],
} as const;

export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
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
        Object.keys(body).sort().join(",") !== "caseId,template" ||
        !("caseId" in body) || typeof body.caseId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(body.caseId) ||
        !("template" in body) || typeof body.template !== "string" ||
        !Object.prototype.hasOwnProperty.call(CHECKLISTS, body.template)) {
      return new Response(JSON.stringify({ error: "Invalid checklist request" }), { status: 400, headers });
    }
    const caseId = body.caseId as string;
    const template = body.template as keyof typeof CHECKLISTS;
    const matchingCase = await config.DB.prepare(
      "SELECT id, title FROM client_cases WHERE id = ? AND client_user_id = ? AND deleted_at IS NULL"
    ).bind(caseId, "demo-fictional-client").all<{ id: string; title: string }>();
    const demoCase = matchingCase.results[0];
    if (!demoCase) return new Response(JSON.stringify({ error: "Demo case not found" }), { status: 404, headers });
    if (!demoCase.title.startsWith("DEMO — ")) {
      return new Response(JSON.stringify({ error: "Demo cases only" }), { status: 403, headers });
    }
    const count = await config.DB.prepare(
      "SELECT COUNT(*) AS total FROM case_document_requirements WHERE case_id = ?"
    ).bind(caseId).all<{ total: number }>();
    if (Number(count.results[0]?.total ?? 0) !== 0) {
      return new Response(JSON.stringify({ error: "Checklist already exists" }), { status: 409, headers });
    }
    for (const [index, label] of CHECKLISTS[template].entries()) {
      await config.DB.prepare(
        "INSERT INTO case_document_requirements (id, case_id, label, required, sort_order) VALUES (?, ?, ?, 1, ?)"
      ).bind(crypto.randomUUID(), caseId, label, index).run();
    }
    return new Response(JSON.stringify({ created: CHECKLISTS[template].length }), { status: 201, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Could not create demo checklist" }), { status: 503, headers });
  }
}

/** Toggle the required flag for an existing fictional demo checklist item. */
export async function PATCH(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
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
        Object.keys(body).sort().join(",") !== "caseId,required,requirementId" ||
        !("caseId" in body) || typeof body.caseId !== "string" ||
        !("requirementId" in body) || typeof body.requirementId !== "string" ||
        !("required" in body) || typeof body.required !== "boolean" ||
        !/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(body.caseId) ||
        !/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(body.requirementId)) {
      return new Response(JSON.stringify({ error: "Invalid requirement update" }), { status: 400, headers });
    }
    const caseId = body.caseId as string;
    const requirementId = body.requirementId as string;
    const required = body.required as boolean;
    const result = await config.DB.prepare(
      "UPDATE case_document_requirements SET required = ? WHERE id = ? AND case_id = ? AND EXISTS (SELECT 1 FROM client_cases WHERE id = ? AND client_user_id = ? AND title LIKE 'DEMO — %' AND deleted_at IS NULL)"
    ).bind(required ? 1 : 0, requirementId, caseId, caseId, "demo-fictional-client").run() as { meta?: { changes?: number } };
    if (!result.meta?.changes) return new Response(JSON.stringify({ error: "Demo requirement not found" }), { status: 404, headers });
    return new Response(JSON.stringify({ id: requirementId, required }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Could not update requirement" }), { status: 503, headers });
  }
}
