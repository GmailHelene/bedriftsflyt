import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, signerSlug } from "@/lib/auth";
import { hentBedrift } from "@/lib/repository";
import { erRateLimited } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukjent";
  if (await erRateLimited("login-dev:" + ip)) {
    return NextResponse.redirect(new URL("/dashboard/login?feil=for-mange-forsok", req.url), { status: 303 });
  }

  const form = await req.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const passord = String(form.get("passord") ?? "");
  // Ingen hardkodet fallback: uten DASHBOARD_DEV_PASSWORD er innlogging umulig (fail closed).
  const devPassord = process.env.DASHBOARD_DEV_PASSWORD;

  const bedrift = await hentBedrift(slug);
  const ok = !!bedrift && !!devPassord && passord === devPassord;

  if (!ok) {
    return NextResponse.redirect(new URL("/dashboard/login?feil=dev", req.url), { status: 303 });
  }

  const res = NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE, signerSlug(slug), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
