import { NextRequest, NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/auth";
import { hentAvtale } from "@/lib/vipps-recurring";
import { hentAbonnement, settAbonnement } from "@/lib/repository";

export const runtime = "nodejs";

// Henter fersk avtalestatus fra Vipps og lagrer den (kalles etter godkjenning + fra «Oppdater status»).
export async function GET(req: NextRequest) {
  const slug = getSessionSlug();
  if (!slug) return NextResponse.redirect(new URL("/dashboard/login", req.url), { status: 303 });

  const ab = await hentAbonnement(slug);
  if (ab.agreementId) {
    try {
      const live = await hentAvtale(ab.agreementId);
      await settAbonnement(slug, ab.agreementId, live.status);
    } catch {
      // ignorer — behold lagret status
    }
  }
  return NextResponse.redirect(new URL("/dashboard?abonnement=ok", req.url), { status: 303 });
}
