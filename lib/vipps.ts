// Vipps ePayment-integrasjon (Milepæl 4). Bygget mot TESTMILJØET (apitest.vipps.no).
// Kilde: developer.vippsmobilepay.com (ePayment + Webhooks).
// MÅ verifiseres mot ekte Vipps-testmiljø når nøklene er på plass.
import crypto from "node:crypto";
import { env } from "./env";

const BASE = env.VIPPS_BASE_URL ?? "https://apitest.vipps.no";

export function fellesHeadere(): Record<string, string> {
  return {
    "Ocp-Apim-Subscription-Key": env.VIPPS_SUBSCRIPTION_KEY ?? "",
    "Merchant-Serial-Number": env.VIPPS_MSN ?? "",
    "Vipps-System-Name": "bedriftsflyt",
    "Vipps-System-Version": "0.1.0",
  };
}

export function vippsKonfigurert(): boolean {
  return Boolean(env.VIPPS_CLIENT_ID && env.VIPPS_CLIENT_SECRET && env.VIPPS_SUBSCRIPTION_KEY && env.VIPPS_MSN);
}

export async function hentAccessToken(): Promise<string> {
  const res = await fetch(`${BASE}/accesstoken/get`, {
    method: "POST",
    headers: {
      client_id: env.VIPPS_CLIENT_ID ?? "",
      client_secret: env.VIPPS_CLIENT_SECRET ?? "",
      "Ocp-Apim-Subscription-Key": env.VIPPS_SUBSCRIPTION_KEY ?? "",
      "Merchant-Serial-Number": env.VIPPS_MSN ?? "",
    },
  });
  if (!res.ok) throw new Error(`Vipps access token feilet: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function opprettBetaling(input: {
  referanse: string;
  belopOre: number;
  beskrivelse: string;
  returUrl: string;
}): Promise<{ redirectUrl: string; reference: string }> {
  const token = await hentAccessToken();
  const res = await fetch(`${BASE}/epayment/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": crypto.randomUUID(),
      ...fellesHeadere(),
    },
    body: JSON.stringify({
      amount: { currency: "NOK", value: input.belopOre },
      paymentMethod: { type: "WALLET" },
      reference: input.referanse,
      returnUrl: input.returUrl,
      userFlow: "WEB_REDIRECT",
      paymentDescription: input.beskrivelse,
    }),
  });
  if (!res.ok) throw new Error(`Vipps opprett betaling feilet: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { redirectUrl: string; reference: string };
  return { redirectUrl: data.redirectUrl, reference: data.reference };
}

export async function hentBetaling(referanse: string): Promise<unknown> {
  const token = await hentAccessToken();
  const res = await fetch(`${BASE}/epayment/v1/payments/${encodeURIComponent(referanse)}`, {
    headers: { Authorization: `Bearer ${token}`, ...fellesHeadere() },
  });
  if (!res.ok) throw new Error(`Vipps hent betaling feilet: ${res.status}`);
  return res.json();
}

// Webhook-signaturvern (HMAC-SHA256). KRITISK: aldri stol på en uverifisert webhook.
export function verifiserWebhook(opts: {
  method: string;
  pathAndQuery: string;
  headers: Headers;
  rawBody: string;
  secret: string;
}): boolean {
  const xMsDate = opts.headers.get("x-ms-date") ?? "";
  const host = opts.headers.get("host") ?? "";
  const contentSha = opts.headers.get("x-ms-content-sha256") ?? "";
  const auth = opts.headers.get("authorization") ?? "";

  // 1) innhold-hash må stemme
  const beregnetInnhold = crypto.createHash("sha256").update(opts.rawBody, "utf8").digest("base64");
  if (beregnetInnhold !== contentSha) return false;

  // 2) signaturstreng: METHOD\npathAndQuery\ndate;host;contentHash
  const signaturStreng = `${opts.method}\n${opts.pathAndQuery}\n${xMsDate};${host};${contentSha}`;
  const beregnetSig = crypto.createHmac("sha256", opts.secret).update(signaturStreng, "utf8").digest("base64");

  // 3) hent Signature=... fra Authorization-headeren
  const m = auth.match(/Signature=([^&\s]+)/);
  const oppgittSig = m ? m[1] : "";
  if (!oppgittSig) return false;

  const a = Buffer.from(beregnetSig);
  const b = Buffer.from(oppgittSig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
