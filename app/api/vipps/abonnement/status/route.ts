import { NextRequest, NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/auth";
import { hentAvtale } from "@/lib/vipps-recurring";
import { hentAbonnement, settAbonnement } from "@/lib/repository";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Henter fersk avtalestatus fra Vipps og lagrer den (kalles etter godkjenning + fra «Oppdater status»).
export async function GET(req: NextRequest) {
  const origin = env.APP_BASE_URL ?? new URL(req.url).origin;
  const slug = getSessionSlug();
  if (!slug) return NextResponse.redirect(new URL("/dashboard/login", origin), { status: 303 });

  const ab = await hentAbonnement(slug);
  if (ab.agreementId) {
    try {
      const live = await hentAvtale(ab.agreementId);
      await settAbonnement(slug, ab.agreementId, live.status);
    } catch (e) {
      console.warn("[vipps/abonnement/status] kunne ikke hente fersk status, beholder lagret:", e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.redirect(new URL("/dashboard?abonnement=ok", origin), { status: 303 });
}
