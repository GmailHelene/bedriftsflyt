// Stripe-abonnement (Bedriftsflyt 389 kr/mnd, 14 dagers gratis prøve, ingen binding).
// Fetch-basert mot Stripe REST-API — ingen ekstra avhengighet. No-op uten nøkler.
import crypto from "node:crypto";

const BASE = "https://api.stripe.com/v1";

export function stripeKonfigurert(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

function headere(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

// Oppretter en Checkout-økt for abonnement med 14 dagers prøvetid. Returnerer URL-en kunden sendes til.
export async function opprettCheckout(input: {
  slug: string;
  epost?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  if (!stripeKonfigurert()) return null;
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", process.env.STRIPE_PRICE_ID as string);
  body.set("line_items[0][quantity]", "1");
  // Ingen Stripe-trial her: de 14 gratis dagene er kortfrie og gis ved registrering.
  // Å starte abonnement = begynne å betale (389 kr/mnd).
  body.set("success_url", input.successUrl);
  body.set("cancel_url", input.cancelUrl);
  body.set("client_reference_id", input.slug);
  body.set("allow_promotion_codes", "true");
  if (input.epost) body.set("customer_email", input.epost);

  const res = await fetch(`${BASE}/checkout/sessions`, { method: "POST", headers: headere(), body });
  if (!res.ok) {
    console.error("[stripe] checkout feilet", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

// Billing-portal så kunden kan si opp / bytte kort selv.
export async function opprettPortal(customerId: string, returnUrl: string): Promise<string | null> {
  if (!stripeKonfigurert()) return null;
  const body = new URLSearchParams();
  body.set("customer", customerId);
  body.set("return_url", returnUrl);
  const res = await fetch(`${BASE}/billing_portal/sessions`, { method: "POST", headers: headere(), body });
  if (!res.ok) {
    console.error("[stripe] portal feilet", res.status);
    return null;
  }
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

// Verifiserer webhook-signaturen (Stripe-Signature: t=...,v1=...).
export function verifiserWebhook(rawBody: string, sigHeader: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !sigHeader) return false;
  const deler = Object.fromEntries(sigHeader.split(",").map((d) => d.split("=") as [string, string]));
  const t = deler["t"];
  const v1 = deler["v1"];
  if (!t || !v1) return false;
  const forventet = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(forventet));
  } catch {
    return false;
  }
}
