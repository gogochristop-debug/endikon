import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { services } from "@/lib/content";
import { QUOTE_INTAKE_ENABLED, validateQuoteRequest } from "@/lib/quote-intake";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 8192;
const allowedServices = new Set(services.map((service) => service.slug));

type QuoteDB = {
  prepare(sql: string): {
    bind(...values: unknown[]): { run(): Promise<unknown> };
  };
};

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Private rollout scaffold. This endpoint MUST remain disabled until:
 * - rate limiting, abuse controls, privacy notice and retention are reviewed;
 * - Cloudflare deployment and D1 migrations are verified;
 * - secure, authenticated admin access exists for submitted requests.
 */
export async function POST(request: NextRequest) {
  if (!QUOTE_INTAKE_ENABLED) return jsonError(503, "intake_unavailable");

  // Fail closed for requests without a trustworthy same-origin signal.
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return jsonError(403, "origin_not_allowed");

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json"))
    return jsonError(415, "unsupported_media_type");

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES)
    return jsonError(413, "request_too_large");

  let payload: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES)
      return jsonError(413, "request_too_large");
    payload = JSON.parse(raw);
  } catch {
    return jsonError(400, "invalid_json");
  }

  const result = validateQuoteRequest(payload, allowedServices);
  if (!result.ok) return jsonError(400, result.error);

  try {
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: QuoteDB }).DB;
    if (!db) return jsonError(503, "intake_unavailable");

    const { name, email, phone, service, matterType, details } = result.value;
    const id = crypto.randomUUID();
    const consentAt = new Date().toISOString();
    await db.prepare(
      "INSERT INTO quote_requests (id, name, email, phone, service, matter_type, details, consent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, name, email, phone || null, service, matterType || null, details, consentAt).run();

    return NextResponse.json({ ok: true, reference: id }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // Do not leak database errors or personal information to callers or logs.
    return jsonError(503, "intake_unavailable");
  }
}

export async function GET() {
  return jsonError(405, "method_not_allowed");
}
