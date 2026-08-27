import { cookies } from "next/headers";
import { signerVerdi, verifiserVerdi } from "@gronbergtech/kundebox-sikker-kjerne";

export const SESSION_COOKIE = "bf_session";
export const VIPPS_SUB_COOKIE = "bf_vipps_sub"; // midlertidig, mens bruker kobler bedrift
export const OIDC_STATE_COOKIE = "bf_oidc_state";
export const VIPPS_KOBLE_COOKIE = "bf_vipps_koble"; // slug som skal kobles til Vipps (fra Innstillinger)

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length > 0) return s;
  // Ingen nøkkel satt. I produksjon feiler vi heller enn å signere cookies med en
  // kjent nøkkel (ellers kan sesjoner forfalskes). Lokalt tillates en dev-nøkkel.
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET må settes i produksjon.");
  }
  return "kun-lokal-usikker-dev-nokkel";
}

// Signerer slug så en manuelt satt cookie ikke kan forfalskes.
export function signerSlug(slug: string): string {
  return signerVerdi(slug, secret());
}

function verifiser(value: string | undefined): string | null {
  return verifiserVerdi(value, secret());
}

export function getSessionSlug(): string | null {
  return verifiser(cookies().get(SESSION_COOKIE)?.value);
}
