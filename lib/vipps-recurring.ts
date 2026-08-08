// Vipps Recurring (abonnement, v3). Bygget mot testmiljøet — verifiser mot Vipps-docs når nøkler er på plass.
// Kilde: developer.vippsmobilepay.com/docs/APIs/recurring-api.
import crypto from "node:crypto";
import { env } from "./env";
import { hentAccessToken, fellesHeadere } from "./vipps";

const BASE = env.VIPPS_BASE_URL ?? "https://apitest.vipps.no";

export async function opprettAvtale(input: {
  belopOre: number;
  produktnavn: string;
  redirectUrl: string;
  agreementUrl: string;
}): Promise<{ agreementId: string; confirmationUrl: string }> {
  const token = await hentAccessToken();
  const res = await fetch(`${BASE}/recurring/v3/agreements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": crypto.randomUUID(),
      ...fellesHeadere(),
    },
    body: JSON.stringify({
      pricing: { type: "LEGACY", amount: input.belopOre, currency: "NOK" },
      interval: { unit: "MONTH", count: 1 },
      productName: input.produktnavn,
      merchantRedirectUrl: input.redirectUrl,
      merchantAgreementUrl: input.agreementUrl,
    }),
  });
  if (!res.ok) throw new Error(`Vipps opprett avtale feilet: ${res.status} ${await res.text()}`);
  const d = (await res.json()) as { agreementId: string; vippsConfirmationUrl: string };
  return { agreementId: d.agreementId, confirmationUrl: d.vippsConfirmationUrl };
}

export async function hentAvtale(agreementId: string): Promise<{ status: string }> {
  const token = await hentAccessToken();
  const res = await fetch(`${BASE}/recurring/v3/agreements/${encodeURIComponent(agreementId)}`, {
    headers: { Authorization: `Bearer ${token}`, ...fellesHeadere() },
  });
  if (!res.ok) throw new Error(`Vipps hent avtale feilet: ${res.status}`);
  const d = (await res.json()) as { status: string };
  return { status: d.status };
}

export async function opprettTrekk(
  agreementId: string,
  input: { belopOre: number; beskrivelse: string }
): Promise<{ chargeId: string }> {
  const token = await hentAccessToken();
  const res = await fetch(`${BASE}/recurring/v3/agreements/${encodeURIComponent(agreementId)}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": crypto.randomUUID(),
      ...fellesHeadere(),
    },
    body: JSON.stringify({
      amount: input.belopOre,
      transactionType: "DIRECT_CAPTURE",
      description: input.beskrivelse,
      retryDays: 5,
      orderId: `bf-sub-${crypto.randomUUID().slice(0, 12)}`,
    }),
  });
  if (!res.ok) throw new Error(`Vipps trekk feilet: ${res.status} ${await res.text()}`);
  const d = (await res.json()) as { chargeId: string };
  return { chargeId: d.chargeId };
}
