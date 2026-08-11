import { z } from "zod";

// Miljøvariabel-validering. Feiler tidlig ved feil FORMAT (f.eks. ugyldig URL),
// i stedet for en kryptisk krasj i produksjon.
// Tomme strenger (typisk fra en kopiert .env-mal) behandles som "ikke satt".
// Feltene er valgfrie nå fordi appen kan kjøre uten DB (mock) og uten Vipps/KI (M4/M5).
// Gjøres required etter hvert som funksjonene faktisk tas i bruk.
const tomBlirUndefined = (v: unknown) => (v === "" ? undefined : v);

const valgfriTekst = z.preprocess(tomBlirUndefined, z.string().min(1).optional());

const schema = z.object({
  DATABASE_URL: z.preprocess(tomBlirUndefined, z.string().url().optional()),
  DATABASE_SSL: z.preprocess(tomBlirUndefined, z.enum(["true", "false"]).optional()),
  DASHBOARD_DEV_PASSWORD: valgfriTekst,
  ANTHROPIC_API_KEY: valgfriTekst,
  BREVO_API_KEY: valgfriTekst,
  MAIL_DEFAULT_SENDER: valgfriTekst,
  VIPPS_CLIENT_ID: valgfriTekst,
  VIPPS_CLIENT_SECRET: valgfriTekst,
  VIPPS_SUBSCRIPTION_KEY: valgfriTekst,
  VIPPS_MSN: valgfriTekst,
  VIPPS_WEBHOOK_SECRET: valgfriTekst,
  // Base-URL-er: mykt validert (plain string) så en manglende https:// ikke tar ned hele deployen.
  // Feil verdi gir bare at den ene funksjonen feiler, ikke at appen kræsjer.
  VIPPS_BASE_URL: valgfriTekst,
  APP_BASE_URL: valgfriTekst,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Ugyldige miljøvariabler:", parsed.error.flatten().fieldErrors);
  throw new Error("Miljøvariabel-validering feilet (se lib/env.ts)");
}

export const env = parsed.data;
