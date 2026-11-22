/** Server-only per-installation public identity. Never store credentials here. */
import "server-only";

export type FirmBrand = {
  name: string;
  publicUrl: string;
  contactEmail: string | null;
};

function cleanName(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length <= 100 && !/[<>\r\n]/.test(trimmed) ? trimmed : "ENDIKON";
}

function cleanUrl(value: string | undefined): string {
  if (!value) return "https://endikon.com";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) return "https://endikon.com";
    return parsed.origin;
  } catch { return "https://endikon.com"; }
}

function cleanEmail(value: string | undefined): string | null {
  const email = value?.trim();
  return email && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function getFirmBrand(): FirmBrand {
  return {
    name: cleanName(process.env.ENDIKON_FIRM_NAME),
    publicUrl: cleanUrl(process.env.ENDIKON_PUBLIC_URL),
    contactEmail: cleanEmail(process.env.ENDIKON_CONTACT_EMAIL),
  };
}
