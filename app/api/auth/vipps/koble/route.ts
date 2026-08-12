import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { byggAuthUrl, vippsLoginKonfigurert } from "@/lib/vipps-login";
import { getSessionSlug, OIDC_STATE_COOKIE, VIPPS_KOBLE_COOKIE } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Starter Vipps-innlogging for å KOBLE Vipps til den innloggede bedriften (ikke opprette ny).
export async function GET(req: NextRequest) {
  const origin = env.APP_BASE_URL ?? new URL(req.url).origin;
  const slug = getSessionSlug();
  if (!slug) return NextResponse.redirect(new URL("/dashboard/login", origin), { status: 303 });
  if (!vippsLoginKonfigurert()) {
    return NextResponse.redirect(new URL("/dashboard/oppsett?feil=vipps", origin), { status: 303 });
  }

  const redirectUri = `${origin}/api/auth/vipps/callback`;
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const url = await byggAuthUrl({ redirectUri, state, nonce });

  const res = NextResponse.redirect(url, { status: 303 });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(OIDC_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 600 });
  // Marker at dette er en «koble»-flyt for denne bedriften.
  res.cookies.set(VIPPS_KOBLE_COOKIE, slug, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 600 });
  return res;
}
