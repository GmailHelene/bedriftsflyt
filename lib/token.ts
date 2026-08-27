// Signerte tokens for handlinger uten innlogging (f.eks. kunde som avbestiller via e-postlenke).
// HMAC hindrer at noen gjetter/forfalsker en annen kundes booking-id.
import crypto from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
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

// Tidsbegrenset token for passord-tilbakestilling (1 time). Bærer slug + utløp, signert.
export function signerReset(slug: string): string {
  const utlop = Date.now() + 1000 * 60 * 60;
  const data = `${slug}|${utlop}`;
  const sig = crypto.createHmac("sha256", secret()).update(data).digest("base64url");
  return `${Buffer.from(data).toString("base64url")}.${sig}`;
}

export function verifiserReset(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const dataB64 = token.slice(0, i);
  const sig = token.slice(i + 1);
  let data: string;
  try {
    data = Buffer.from(dataB64, "base64url").toString();
  } catch {
    return null;
  }
  const forventet = crypto.createHmac("sha256", secret()).update(data).digest("base64url");
  try {
    if (!(sig.length === forventet.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(forventet)))) {
      return null;
    }
  } catch {
    return null;
  }
  const [slug, utlopStr] = data.split("|");
  if (!slug || !utlopStr || Date.now() > Number(utlopStr)) return null;
  return slug;
}
