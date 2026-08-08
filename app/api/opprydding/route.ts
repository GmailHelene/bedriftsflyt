// GDPR-opprydding: anonymiserer gammel kundedata + sletter gamle chat-logger.
// Kjøres av en planlagt jobb (f.eks. månedlig) med CRON_SECRET.
import { NextRequest, NextResponse } from "next/server";
import { kjorOpprydding } from "@/lib/repository";

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
  if (!autorisert(req)) return NextResponse.json({ feil: "Ikke autorisert." }, { status: 401 });
  const resultat = await kjorOpprydding();
  return NextResponse.json({ ok: true, ...resultat });
}

export async function POST(req: NextRequest) {
  return kjor(req);
}
export async function GET(req: NextRequest) {
  return kjor(req);
}
