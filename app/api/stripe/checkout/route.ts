import { NextRequest, NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/auth";
import { opprettCheckout, stripeKonfigurert } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = getSessionSlug();
  const base = process.env.APP_BASE_URL || new URL(req.url).origin;
  if (!slug) return NextResponse.redirect(new URL("/dashboard/login", base));
  if (!stripeKonfigurert()) return NextResponse.redirect(new URL("/dashboard?abonnement=mangler", base));

  const url = await opprettCheckout({
    slug,
    successUrl: `${base}/dashboard?abonnement=ok`,
    cancelUrl: `${base}/dashboard?abonnement=avbrutt`,
  });
  if (!url) return NextResponse.redirect(new URL("/dashboard?abonnement=feil", base));
  return NextResponse.redirect(url);
}
