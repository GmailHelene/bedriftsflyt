import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { opprettBooking, hentBedrift } from "@/lib/repository";
import { sendEpost } from "@/lib/email";
import { erRateLimited } from "@/lib/ratelimit";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

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

  if (res.ok) {
    // Bookingbekreftelse til kunden (best-effort - skal aldri velte selve bookingen).
    if (p.epost) {
      try {
        const bedrift = await hentBedrift(p.slug);
        const tjeneste = bedrift?.tjenester.find((t) => t.id === p.service)?.navn ?? "Timen din";
        const bedriftNavn = bedrift?.navn ?? "";
        const naar = `${p.dato} kl. ${p.tid}`;
        const hosTekst = bedriftNavn ? ` hos ${esc(bedriftNavn)}` : "";
        const html =
          `<p>Hei ${esc(p.navn)},</p>` +
          `<p>Timen din er bekreftet${bedriftNavn ? ` hos <strong>${esc(bedriftNavn)}</strong>` : ""}:</p>` +
          `<p><strong>${esc(tjeneste)}</strong><br>${esc(naar)}</p>` +
          `<p>Trenger du å endre eller avlyse, ta kontakt${hosTekst} direkte.</p>` +
          `<p>Vi sees!</p>`;
        const tekst =
          `Hei ${p.navn},\n\nTimen din er bekreftet${bedriftNavn ? ` hos ${bedriftNavn}` : ""}:\n` +
          `${tjeneste}\n${naar}\n\nTrenger du å endre eller avlyse, ta kontakt${bedriftNavn ? ` med ${bedriftNavn}` : ""} direkte.\n\nVi sees!`;
        await sendEpost({ til: p.epost, emne: `Bekreftet: ${tjeneste} ${naar}`, html, tekst });
      } catch (e) {
        console.error("[booking] kunne ikke sende bekreftelse:", e instanceof Error ? e.message : e);
      }
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  if (res.grunn === "opptatt")
    return NextResponse.json({ feil: "Tiden ble nettopp booket. Velg en annen." }, { status: 409 });
  if (res.grunn === "ingen_db")
    return NextResponse.json({ feil: "Booking krever database (demo lagrer ikke)." }, { status: 503 });
  return NextResponse.json({ feil: "Ugyldig tjeneste eller bedrift." }, { status: 400 });
}
