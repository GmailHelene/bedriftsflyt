import { cookies } from "next/headers";
import crypto from "node:crypto";

export const SESSION_COOKIE = "bf_session";
export const VIPPS_SUB_COOKIE = "bf_vipps_sub"; // midlertidig, mens bruker kobler bedrift
export const OIDC_STATE_COOKIE = "bf_oidc_state";

function secret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.DASHBOARD_DEV_PASSWORD ||
    "bf-dev-secret-bytt-i-produksjon"
  );
}

// Signerer slug så en manuelt satt cookie ikke kan forfalskes.
export function signerSlug(slug: string): string {
  const sig = crypto.createHmac("sha256", secret()).update(slug).digest("base64url");
  return `${slug}.${sig}`;
}

function verifiser(value: string | undefined): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 1) return null;
  const slug = value.slice(0, i);
  const sig = value.slice(i + 1);
  const forventet = crypto.createHmac("sha256", secret()).update(slug).digest("base64url");
  try {
    if (sig.length === forventet.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(forventet))) {
      return slug;
    }
  } catch {
    // ugyldig
  }
  return null;
}

export function getSessionSlug(): string | null {
  return verifiser(cookies().get(SESSION_COOKIE)?.value);
}
