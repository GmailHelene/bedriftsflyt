import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { opprettBooking } from "@/lib/repository";
import { erRateLimited } from "@/lib/ratelimit";

const schema = z.object({
  slug: z.string().min(1),
  service: z.string().min(1),
  dato: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tid: z.string().regex(/^\d{2}:\d{2}$/),
  navn: z.string().min(1).max(120),
  telefon: z.string().max(30).optional(),
  epost: z.string().email().max(160).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukjent";
  if (await erRateLimited("book:" + ip)) {
    return NextResponse.json({ feil: "For mange forsøk. Vent litt." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ feil: "Ugyldige data." }, { status: 400 });
  }

  const p = parsed.data;
  const res = await opprettBooking({
    slug: p.slug,
    serviceId: p.service,
    dato: p.dato,
    tid: p.tid,
    navn: p.navn,
    telefon: p.telefon,
    epost: p.epost,
  });

  if (res.ok) return NextResponse.json({ ok: true }, { status: 201 });
  if (res.grunn === "opptatt")
    return NextResponse.json({ feil: "Tiden ble nettopp booket. Velg en annen." }, { status: 409 });
  if (res.grunn === "ingen_db")
    return NextResponse.json({ feil: "Booking krever database (demo lagrer ikke)." }, { status: 503 });
  return NextResponse.json({ feil: "Ugyldig tjeneste eller bedrift." }, { status: 400 });
}
