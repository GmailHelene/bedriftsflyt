import { NextRequest, NextResponse } from "next/server";
import { opprettBetaling, vippsKonfigurert } from "@/lib/vipps";
import { hentFakturaForBetaling } from "@/lib/repository";

export const runtime = "nodejs";

// Starter en Vipps-betaling for en faktura og sender brukeren videre til Vipps.
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? "";
  if (!ref) return NextResponse.json({ feil: "Mangler ref." }, { status: 400 });

  if (!vippsKonfigurert()) {
    return NextResponse.redirect(new URL("/dashboard?vipps=mangler", req.url), { status: 303 });
  }

  const f = await hentFakturaForBetaling(ref);
  if (!f) return NextResponse.json({ feil: "Fant ikke faktura." }, { status: 404 });

  try {
    const res = await opprettBetaling({
      referanse: ref,
      belopOre: f.sumOre,
      beskrivelse: f.beskrivelse,
      returUrl: new URL("/dashboard", req.url).toString(),
    });
    return NextResponse.redirect(res.redirectUrl, { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/dashboard?vipps=feil", req.url), { status: 303 });
  }
}
