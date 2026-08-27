// Signerte tokens for handlinger uten innlogging (f.eks. kunde som avbestiller via e-postlenke).
// Bruker den delte pakken kundebox-sikker-kjerne, samme format som før.
import { signerVerdi, verifiserVerdi, signerVerdiMedUtlop, verifiserVerdiMedUtlop } from "@gronbergtech/kundebox-sikker-kjerne";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length > 0) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET må settes i produksjon.");
  }
  return "kun-lokal-usikker-dev-nokkel";
}

export function signerBooking(id: string): string {
  return signerVerdi(id, secret());
}

export function verifiserBookingToken(token: string): string | null {
  return verifiserVerdi(token, secret());
}

// Tidsbegrenset token for passord-tilbakestilling (1 time). Bærer slug + utløp, signert.
export function signerReset(slug: string): string {
  return signerVerdiMedUtlop(slug, secret(), 1000 * 60 * 60);
}

export function verifiserReset(token: string): string | null {
  return verifiserVerdiMedUtlop(token, secret());
}
