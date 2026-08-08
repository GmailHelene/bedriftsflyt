import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionSlug } from "@/lib/auth";
import { hentBedrift } from "@/lib/repository";
import { foreslaChatbotOppsett, harKI } from "@/lib/compose";
import { erRateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";

const schema = z.object({ beskrivelse: z.string().min(1).max(1000) });

export async function POST(req: NextRequest) {
  const slug = getSessionSlug();
  if (!slug) return NextResponse.json({ feil: "Du må være innlogget." }, { status: 401 });
  if (!harKI()) return NextResponse.json({ feil: "KI er ikke konfigurert." }, { status: 503 });
  if (await erRateLimited("forslag:" + slug)) {
    return NextResponse.json({ feil: "For mange forespørsler. Vent litt." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ feil: "Ugyldige data." }, { status: 400 });

  const b = await hentBedrift(slug);
  if (!b) return NextResponse.json({ feil: "Fant ikke bedriften." }, { status: 404 });

  try {
    const forslag = await foreslaChatbotOppsett(b, p.data.beskrivelse);
    return NextResponse.json({ forslag });
  } catch {
    return NextResponse.json({ feil: "KI-feil. Prøv igjen." }, { status: 502 });
  }
}
