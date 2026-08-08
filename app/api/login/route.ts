import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { hentBedrift } from "@/lib/repository";

export async function POST(req: NextRequest) {
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
  res.cookies.set(SESSION_COOKIE, slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
