// Signerte tokens for handlinger uten innlogging (f.eks. kunde som avbestiller via e-postlenke).
// HMAC hindrer at noen gjetter/forfalsker en annen kundes booking-id.
import crypto from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.DASHBOARD_DEV_PASSWORD;
  if (s && s.length > 0) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET må settes i produksjon.");
  }
  return "kun-lokal-usikker-dev-nokkel";
}

export function signerBooking(id: string): string {
  const sig = crypto.createHmac("sha256", secret()).update(id).digest("base64url");
  return `${id}.${sig}`;
}

export function verifiserBookingToken(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const id = token.slice(0, i);
  const sig = token.slice(i + 1);
  const forventet = crypto.createHmac("sha256", secret()).update(id).digest("base64url");
  try {
    if (sig.length === forventet.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(forventet))) {
      return id;
    }
  } catch {
    // ugyldig
  }
  return null;
}
