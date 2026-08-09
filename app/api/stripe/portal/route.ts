import { NextRequest, NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/auth";
import { hentStripeKunde } from "@/lib/repository";
import { opprettPortal, stripeKonfigurert } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = getSessionSlug();
  const base = process.env.APP_BASE_URL || new URL(req.url).origin;
  if (!slug) return NextResponse.redirect(new URL("/dashboard/login", base));
  if (!stripeKonfigurert()) return NextResponse.redirect(new URL("/dashboard?abonnement=mangler", base));

  const kunde = await hentStripeKunde(slug);
  if (!kunde) return NextResponse.redirect(new URL("/dashboard?abonnement=ingen", base));

  const url = await opprettPortal(kunde, `${base}/dashboard`);
  if (!url) return NextResponse.redirect(new URL("/dashboard?abonnement=feil", base));
  return NextResponse.redirect(url);
}
