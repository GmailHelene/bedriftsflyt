// Diagnose: viser HVILKE Vipps-variabler appen ser (aldri verdiene). Beskyttet med CRON_SECRET.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function autorisert(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const key = new URL(req.url).searchParams.get("key");
  const auth = req.headers.get("authorization");
  return key === secret || auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!autorisert(req)) return NextResponse.json({ feil: "Ikke autorisert." }, { status: 401 });
  return NextResponse.json({
    VIPPS_CLIENT_ID: Boolean(process.env.VIPPS_CLIENT_ID),
    VIPPS_CLIENT_SECRET: Boolean(process.env.VIPPS_CLIENT_SECRET),
    VIPPS_SUBSCRIPTION_KEY: Boolean(process.env.VIPPS_SUBSCRIPTION_KEY),
    VIPPS_BASE_URL: process.env.VIPPS_BASE_URL ?? null,
    APP_BASE_URL: process.env.APP_BASE_URL ?? null,
  });
}
