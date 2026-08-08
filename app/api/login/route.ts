import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { hentBedrift } from "@/lib/repository";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const passord = String(form.get("passord") ?? "");
  const devPassord = process.env.DASHBOARD_DEV_PASSWORD ?? "dev";

  const bedrift = await hentBedrift(slug);
  const ok = !!bedrift && passord === devPassord;

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
