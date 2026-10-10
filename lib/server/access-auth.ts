import "server-only";

/** Verify Cloudflare Access identity at the origin, not just an email header. */
type AccessClaims = {
  iss?: string; aud?: string[] | string; exp?: number; nbf?: number;
  email?: string; sub?: string;
};
type AccessKey = JsonWebKey & { kid?: string };
const decoder = new TextDecoder();

function decodeBase64Url(input: string): Uint8Array {
  const binary = atob(input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "="));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function decodeJson<T>(part: string): T {
  return JSON.parse(decoder.decode(decodeBase64Url(part))) as T;
}

export async function verifyAdminAccess(
  token: string | null,
  config: { teamDomain: string; audience: string; adminEmail: string },
): Promise<boolean> {
  if (!token || !config.teamDomain || !config.audience || !config.adminEmail) return false;
  const team = config.teamDomain.trim().toLowerCase();
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(team)) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some(p => !p)) return false;
  try {
    const header = decodeJson<{ alg?: string; kid?: string; typ?: string }>(parts[0]);
    const claims = decodeJson<AccessClaims>(parts[1]);
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== "RS256" || !header.kid || !claims.exp || claims.exp <= now ||
        (claims.nbf !== undefined && claims.nbf > now) ||
        claims.iss !== team || !claims.email ||
        claims.email.toLowerCase() !== config.adminEmail.trim().toLowerCase() ||
        !(Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(config.audience)) return false;

    const response = await fetch(team + "/cdn-cgi/access/certs", { cache: "no-store" });
    if (!response.ok) return false;
    const certs = await response.json() as { keys?: AccessKey[] };
    const jwk = certs.keys?.find(k => k.kid === header.kid && k.kty === "RSA");
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signature = decodeBase64Url(parts[2]);
    const data = new TextEncoder().encode(parts[0] + "." + parts[1]);
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data);
  } catch {
    return false;
  }
}
