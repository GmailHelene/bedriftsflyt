// Beskyttet migrerings-endepunkt. Tvangs-kjører de idempotente skjemaendringene og
// rapporterer hvilke som lyktes/feilet. Krever CRON_SECRET (samme som påminnelser).
import { NextRequest, NextResponse } from "next/server";
import { migrerMedRapport } from "@/lib/migrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function autorisert(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}

async function kjor(req: NextRequest) {
  if (!autorisert(req)) {
    return NextResponse.json({ feil: "Ikke autorisert." }, { status: 401 });
  }
  const rapport = await migrerMedRapport();
  const feilet = rapport.filter((r) => !r.ok);
  return NextResponse.json({ ok: feilet.length === 0, antallFeilet: feilet.length, rapport });
}

export async function GET(req: NextRequest) {
  return kjor(req);
}

export async function POST(req: NextRequest) {
  return kjor(req);
}
