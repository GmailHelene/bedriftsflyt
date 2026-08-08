// Enkel dev-sesjon (Milepæl 6, midlertidig).
// ERSTATTES før lansering av passordløs innlogging (Auth.js: e-postlenke/SMS, evt. Vipps-login).
import { cookies } from "next/headers";

export const SESSION_COOKIE = "bf_session";
export const VIPPS_SUB_COOKIE = "bf_vipps_sub"; // midlertidig, mens bruker kobler bedrift
export const OIDC_STATE_COOKIE = "bf_oidc_state";

export function getSessionSlug(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}
