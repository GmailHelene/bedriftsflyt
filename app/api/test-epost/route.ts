// Diagnose for e-post. Sender en testmail direkte via Brevo og rapporterer resultatet.
// Beskyttet med CRON_SECRET. Fjernes når e-post virker.
import { NextRequest, NextResponse } from "next/server";
import { sendEpost } from "@/lib/email";

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

  const til = new URL(req.url).searchParams.get("til");
  if (!til) return NextResponse.json({ feil: "Mangler ?til=din@epost.no" }, { status: 400 });

  const diag = {
    harBrevoKey: Boolean(process.env.BREVO_API_KEY),
    brevoKeyStart: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.slice(0, 8) : null,
    avsender: process.env.MAIL_DEFAULT_SENDER ?? null,
  };

  const resultat = await sendEpost({
    til,
    emne: "Bedriftsflyt testmail",
    html: "<p>Dette er en testmail fra Bedriftsflyt. Får du denne, virker e-posten.</p>",
    tekst: "Testmail fra Bedriftsflyt.",
  });

  return NextResponse.json({ ...diag, resultat });
}
