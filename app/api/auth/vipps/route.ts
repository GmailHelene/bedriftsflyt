import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { byggAuthUrl, vippsLoginKonfigurert } from "@/lib/vipps-login";
import { OIDC_STATE_COOKIE } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Starter Vipps Login (OIDC authorization code flow).
export async function GET(req: NextRequest) {
  if (!vippsLoginKonfigurert()) {
    return NextResponse.redirect(new URL("/dashboard/login?feil=vipps", req.url), { status: 303 });
  }

  const origin = env.APP_BASE_URL ?? new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/vipps/callback`;
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const url = await byggAuthUrl({ redirectUri, state, nonce });
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(OIDC_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
