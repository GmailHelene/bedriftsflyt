import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionSlug } from "@/lib/auth";
import { hentBedrift, hentChatbotConfig } from "@/lib/repository";
import { komponer, harKI } from "@/lib/compose";
import { erRateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  type: z.enum(["instagram", "sms", "anmeldelse", "google"]),
  kontekst: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const slug = getSessionSlug();
  if (!slug) {
    return NextResponse.json({ feil: "Du må være innlogget." }, { status: 401 });
  }
  if (!harKI()) {
    return NextResponse.json({ feil: "KI er ikke konfigurert (mangler ANTHROPIC_API_KEY)." }, { status: 503 });
  }
  if (await erRateLimited("komponer:" + slug)) {
    return NextResponse.json({ feil: "For mange forespørsler. Vent et minutt." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const p = schema.safeParse(body);
  if (!p.success) {
    return NextResponse.json({ feil: "Ugyldige data." }, { status: 400 });
  }

  const b = await hentBedrift(slug);
  if (!b) {
    return NextResponse.json({ feil: "Fant ikke bedriften." }, { status: 404 });
  }

  try {
    const cfg = await hentChatbotConfig(slug);
    const tekst = await komponer(b, p.data.type, p.data.kontekst ?? "", cfg.tone);
    return NextResponse.json({ tekst });
  } catch {
    return NextResponse.json({ feil: "KI-feil. Prøv igjen om litt." }, { status: 502 });
  }
}
