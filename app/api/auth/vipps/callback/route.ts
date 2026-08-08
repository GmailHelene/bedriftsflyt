import { NextRequest, NextResponse } from "next/server";
import { bytteKode, hentBruker } from "@/lib/vipps-login";
import { finnBedriftForEier } from "@/lib/repository";
import { SESSION_COOKIE, VIPPS_SUB_COOKIE, OIDC_STATE_COOKIE } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = req.cookies.get(OIDC_STATE_COOKIE)?.value;
  const secure = process.env.NODE_ENV === "production";

  // state må stemme (CSRF-vern)
  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/dashboard/login?feil=1", req.url), { status: 303 });
  }

  const origin = env.APP_BASE_URL ?? url.origin;
  const redirectUri = `${origin}/api/auth/vipps/callback`;

  try {
    const token = await bytteKode({ code, redirectUri });
    const bruker = await hentBruker(token);
    const slug = await finnBedriftForEier(bruker.sub);

    if (slug) {
      const res = NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
      res.cookies.set(SESSION_COOKIE, slug, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 8 });
      res.cookies.delete(OIDC_STATE_COOKIE);
      return res;
    }

    // Verifisert bruker, men ingen bedrift koblet ennå → send til koble-siden
    const res = NextResponse.redirect(new URL("/dashboard/koble", req.url), { status: 303 });
    res.cookies.set(VIPPS_SUB_COOKIE, bruker.sub, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 600 });
    res.cookies.delete(OIDC_STATE_COOKIE);
    return res;
  } catch {
    return NextResponse.redirect(new URL("/dashboard/login?feil=1", req.url), { status: 303 });
  }
}
