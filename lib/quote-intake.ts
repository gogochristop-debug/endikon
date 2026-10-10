/**
 * Server-side input validation boundary for the future ENDIKON quote API.
 * No persistence, network submission or sensitive data collection is enabled here.
 * Never trust client-side validation as an authorization or security boundary.
 */
export const QUOTE_INTAKE_ENABLED = false;

export type QuoteRequestInput = {
  name: string;
  email: string;
  phone?: string;
  service: string;
  matterType?: string;
  details: string;
  consent: boolean;
};

export type QuoteValidationResult =
  | { ok: true; value: QuoteRequestInput }
  | { ok: false; error: "invalid_request" };

const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
const validServices = new Set([
  "debt-settlement",
  "immigration",
  "property",
  "family",
  "business",
  "other",
]);

export function validateQuoteRequest(
  input: unknown,
  allowedServices: ReadonlySet<string> = validServices,
): QuoteValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { ok: false, error: "invalid_request" };

  const value = input as Record<string, unknown>;
  const stringField = (key: string, max: number, required = true) => {
    const raw = value[key];
    if (raw === undefined && !required) return "";
    if (typeof raw !== "string") return null;
    const normalized = raw.trim();
    if ((required && !normalized) || normalized.length > max) return null;
    return normalized;
  };

  const name = stringField("name", 100);
  const email = stringField("email", 150);
  const phone = stringField("phone", 30, false);
  const service = stringField("service", 100);
  const matterType = stringField("matterType", 120, false);
  const details = stringField("details", 2000);
  if (
    !name || !email || !emailPattern.test(email) ||
    phone === null || !service || !allowedServices.has(service) ||
    matterType === null || !details || value.consent !== true
  ) return { ok: false, error: "invalid_request" };

  return {
    ok: true,
    value: { name, email, phone, service, matterType, details, consent: true },
  };
}
