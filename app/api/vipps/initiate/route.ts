import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { opprettBetaling, vippsKonfigurert } from "@/lib/vipps";

export const runtime = "nodejs";

const schema = z.object({
  referanse: z.string().min(1).max(50),
  belopKr: z.number().positive().max(1_000_000),
  beskrivelse: z.string().min(1).max(100),
  returUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  if (!vippsKonfigurert()) {
    return NextResponse.json({ feil: "Vipps er ikke konfigurert (mangler nøkler i .env.local)." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const p = schema.safeParse(body);
  if (!p.success) {
    return NextResponse.json({ feil: "Ugyldige data." }, { status: 400 });
  }

  try {
    const res = await opprettBetaling({
      referanse: p.data.referanse,
      belopOre: Math.round(p.data.belopKr * 100),
      beskrivelse: p.data.beskrivelse,
      returUrl: p.data.returUrl,
    });
    return NextResponse.json(res);
  } catch (e: unknown) {
    return NextResponse.json({ feil: e instanceof Error ? e.message : "Vipps-feil" }, { status: 502 });
  }
}
