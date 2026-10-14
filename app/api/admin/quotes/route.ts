import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAdminAccess } from "@/lib/server/access-auth";
import { isQuoteStatus, pageQuotesForAuthorizedAdmin } from "@/lib/server/d1-quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all<T>(): Promise<{ results: T[] }>;
};
type AdminEnv = {
  DB?: { prepare(sql: string): D1Statement };
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_ADMIN_AUD?: string;
  ACCESS_ADMIN_EMAIL?: string;
};

export async function GET(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
  try {
    const { env } = await getCloudflareContext();
    const settings = env as unknown as AdminEnv;
    if (!settings.ACCESS_TEAM_DOMAIN || !settings.ACCESS_ADMIN_AUD || !settings.ACCESS_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Admin API not configured" }), { status: 503, headers });
    }
    const authorized = await verifyAdminAccess(request.headers.get("cf-access-jwt-assertion"), {
      teamDomain: settings.ACCESS_TEAM_DOMAIN,
      audience: settings.ACCESS_ADMIN_AUD,
      adminEmail: settings.ACCESS_ADMIN_EMAIL,
    });
    if (!authorized) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    if (!settings.DB) return new Response(JSON.stringify({ error: "Database unavailable" }), { status: 503, headers });
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const query = params.get("q") ?? "";
    const offsetText = params.get("offset") ?? "0";
    const offset = Number(offsetText);
    if ((status !== null && !isQuoteStatus(status)) || query.length > 100 || !/^\\d+$/.test(offsetText) || !Number.isSafeInteger(offset) || offset > 1000000) {
      return new Response(JSON.stringify({ error: "Invalid filters" }), { status: 400, headers });
    }
    const page = await pageQuotesForAuthorizedAdmin(settings.DB, {
      status: status && isQuoteStatus(status) ? status : undefined,
      query,
      limit: 25,
      offset,
    });
    return new Response(JSON.stringify({ ...page, limit: 25, offset }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), { status: 503, headers });
  }
}
