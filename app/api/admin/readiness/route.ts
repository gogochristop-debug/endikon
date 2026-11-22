import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAdminAccess } from "@/lib/server/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Statement = { all<T>(): Promise<{ results: T[] }> };
type Env = {
  DB?: { prepare(sql: string): Statement };
  DOCUMENTS_BUCKET?: unknown;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_ADMIN_AUD?: string;
  ACCESS_ADMIN_EMAIL?: string;
};
const headers = { "Cache-Control": "no-store", "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" };
const reply = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers });

/** Admin-only, read-only deployment preflight; never returns PII, secrets or database rows. */
export async function GET(request: Request): Promise<Response> {
  try {
    const { env } = await getCloudflareContext();
    const config = env as unknown as Env;
    if (!config.ACCESS_TEAM_DOMAIN || !config.ACCESS_ADMIN_AUD || !config.ACCESS_ADMIN_EMAIL) return reply({ error: "Admin API not configured" }, 503);
    const authorized = await verifyAdminAccess(request.headers.get("cf-access-jwt-assertion"), {
      teamDomain: config.ACCESS_TEAM_DOMAIN, audience: config.ACCESS_ADMIN_AUD, adminEmail: config.ACCESS_ADMIN_EMAIL,
    });
    if (!authorized) return reply({ error: "Unauthorized" }, 401);
    if (!config.DB) return reply({ ready: false, checks: { database: false, crmSchema: false, documentStorageBinding: Boolean(config.DOCUMENTS_BUCKET) } }, 503);
    const required = ["crm_clients", "crm_client_case_links", "crm_client_audit", "client_cases"];
    const rows = await config.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('crm_clients','crm_client_case_links','crm_client_audit','client_cases')").all<{ name: string }>();
    const found = new Set(rows.results.map(row => row.name));
    const missing = required.filter(name => !found.has(name));
    const checks = { database: true, crmSchema: missing.length === 0, documentStorageBinding: Boolean(config.DOCUMENTS_BUCKET) };
    // A passing infrastructure preflight is NOT authorization to store real client data.
    return reply({ ready: checks.database && checks.crmSchema && checks.documentStorageBinding, checks, missingTables: missing, productionDataApproved: false }, checks.crmSchema ? 200 : 503);
  } catch {
    return reply({ error: "Preflight unavailable" }, 503);
  }
}
