import { NextRequest, NextResponse } from "next/server";
import { verifiserWebhook } from "@/lib/vipps";
import { markerFakturaBetalt } from "@/lib/repository";
import { env } from "@/lib/env";

// Kjør på Node (crypto + rå body). Aldri edge for dette.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = env.VIPPS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ feil: "Webhook ikke konfigurert" }, { status: 503 });
  }

  const raw = await req.text(); // rå body kreves for signaturen
  const url = new URL(req.url);

  const gyldig = verifiserWebhook({
    method: "POST",
    pathAndQuery: url.pathname + url.search,
    headers: req.headers,
    rawBody: raw,
    secret,
  });

  if (!gyldig) {
    // Uverifisert = mulig forsøk på å forfalske en betaling. Avvis.
    return NextResponse.json({ feil: "Ugyldig signatur" }, { status: 401 });
  }

  let event: { name?: string; reference?: string; success?: boolean } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ feil: "Ugyldig body" }, { status: 400 });
  }

  // Ved vellykket betaling: marker faktura betalt + sett av 35 % til skatt (i repository).
  const betalt = typeof event.name === "string" && /AUTHORIZED|CAPTURED/i.test(event.name);
  if (betalt && event.reference) {
    await markerFakturaBetalt(event.reference);
  }

  return NextResponse.json({ ok: true });
}
