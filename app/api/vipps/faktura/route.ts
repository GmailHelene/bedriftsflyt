import { NextRequest, NextResponse } from "next/server";
import { opprettBetaling, vippsKonfigurert } from "@/lib/vipps";
import { hentFakturaForBetaling } from "@/lib/repository";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Starter en Vipps-betaling for en faktura og sender brukeren videre til Vipps.
export async function GET(req: NextRequest) {
  const origin = env.APP_BASE_URL ?? new URL(req.url).origin;
  const ref = req.nextUrl.searchParams.get("ref") ?? "";
  if (!ref) return NextResponse.json({ feil: "Mangler ref." }, { status: 400 });

  if (!vippsKonfigurert()) {
    return NextResponse.redirect(new URL("/dashboard?vipps=mangler", origin), { status: 303 });
  }

  const f = await hentFakturaForBetaling(ref);
  if (!f) return NextResponse.json({ feil: "Fant ikke faktura." }, { status: 404 });

  try {
    const res = await opprettBetaling({
      referanse: ref,
      belopOre: f.sumOre,
      beskrivelse: f.beskrivelse,
      returUrl: new URL("/dashboard", origin).toString(),
    });
    return NextResponse.redirect(res.redirectUrl, { status: 303 });
  } catch (e) {
    console.error("[vipps/faktura] opprettBetaling feilet:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(new URL("/dashboard?vipps=feil", origin), { status: 303 });
  }
}
