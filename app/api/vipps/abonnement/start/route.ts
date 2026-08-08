import { NextRequest, NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/auth";
import { opprettAvtale } from "@/lib/vipps-recurring";
import { vippsKonfigurert } from "@/lib/vipps";
import { settAbonnement } from "@/lib/repository";

export const runtime = "nodejs";

// Starter et Vipps-abonnement (389 kr/mnd) og sender bruker til Vipps for godkjenning.
export async function GET(req: NextRequest) {
  const slug = getSessionSlug();
  if (!slug) return NextResponse.redirect(new URL("/dashboard/login", req.url), { status: 303 });
  if (!vippsKonfigurert()) {
    return NextResponse.redirect(new URL("/dashboard?abonnement=mangler", req.url), { status: 303 });
  }

  const origin = new URL(req.url).origin;
  try {
    const avtale = await opprettAvtale({
      belopOre: 38900, // 389 kr
      produktnavn: "Bedriftsflyt",
      redirectUrl: `${origin}/api/vipps/abonnement/status`,
      agreementUrl: `${origin}/dashboard`,
    });
    await settAbonnement(slug, avtale.agreementId, "PENDING");
    return NextResponse.redirect(avtale.confirmationUrl, { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/dashboard?abonnement=feil", req.url), { status: 303 });
  }
}
