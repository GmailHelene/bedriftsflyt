// Sender e-postpåminnelse ~dagen før timen. Kjøres av en daglig cron (Railway eller cron-job.org)
// som treffer denne URL-en med hemmeligheten i CRON_SECRET. Beskyttet mot åpen tilgang.
import { NextRequest, NextResponse } from "next/server";
import {
  hentBookingerForPaminnelse,
  markerPaminnelseSendt,
  hentTrialSluttSnart,
  markerTrialPaminnelseSendt,
} from "@/lib/repository";
import { sendEpost } from "@/lib/email";
import { signerBooking } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

function autorisert(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // uten hemmelighet er endepunktet stengt
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}

async function kjor(req: NextRequest) {
  if (!autorisert(req)) {
    return NextResponse.json({ feil: "Ikke autorisert." }, { status: 401 });
  }

  const liste = await hentBookingerForPaminnelse();
  const base = process.env.APP_BASE_URL || new URL(req.url).origin;
  const behandlet: string[] = [];
  let sendt = 0;

  for (const p of liste) {
    if (!p.epost) {
      behandlet.push(p.id); // ingen e-post å sende til - marker som håndtert
      continue;
    }
    const avbestill = `${base}/avbestill/${signerBooking(p.id)}`;
    const hos = p.bedriftNavn ? ` hos <strong>${esc(p.bedriftNavn)}</strong>` : "";
    const html =
      `<p>Hei ${esc(p.navn ?? "")},</p>` +
      `<p>En liten påminnelse om timen din${hos}:</p>` +
      `<p><strong>${esc(p.tjeneste ?? "Time")}</strong><br>${esc(p.naar)}</p>` +
      `<p>Passer det ikke likevel? <a href="${avbestill}">Avbestill her</a>.</p>` +
      `<p>Vi sees!</p>`;
    const tekst =
      `Hei ${p.navn ?? ""},\n\nEn påminnelse om timen din${p.bedriftNavn ? ` hos ${p.bedriftNavn}` : ""}:\n` +
      `${p.tjeneste ?? "Time"}\n${p.naar}\n\nPasser det ikke likevel? ${avbestill}\n\nVi sees!`;

    try {
      const res = await sendEpost({ til: p.epost, emne: `Påminnelse: ${p.tjeneste ?? "time"} ${p.naar}`, html, tekst });
      // Marker kun som sendt hvis e-posten faktisk gikk (ellers prøver vi igjen neste kjøring).
      if (res.ok) {
        behandlet.push(p.id);
        sendt++;
      }
    } catch (e) {
      console.error("[paminnelse] feilet:", e instanceof Error ? e.message : e);
    }
  }

  await markerPaminnelseSendt(behandlet);

  // «Prøveperioden går snart ut»-varsler.
  const trial = await hentTrialSluttSnart();
  const trialSendt: string[] = [];
  for (const t of trial) {
    const dager = Math.max(1, t.dagerIgjen);
    const dagtekst = dager === 1 ? "dag" : "dager";
    const html =
      `<p>Hei,</p>` +
      `<p>Den gratis prøveperioden din på Bedriftsflyt går ut om ${dager} ${dagtekst}.</p>` +
      `<p>Vil du fortsette uten avbrudd, start abonnementet (389 kr/mnd, ingen binding): <a href="${base}/dashboard">${base}/dashboard</a></p>` +
      `<p>Ingen kort er trukket så langt, og du kan si opp når som helst.</p>`;
    const tekst =
      `Hei,\n\nDen gratis prøveperioden din på Bedriftsflyt går ut om ${dager} ${dagtekst}.\n` +
      `Start abonnement for å fortsette: ${base}/dashboard\n\nIngen kort er trukket, og du kan si opp når som helst.`;
    try {
      const r = await sendEpost({ til: t.epost, emne: "Prøveperioden din går snart ut", html, tekst });
      if (r.ok) trialSendt.push(t.slug);
    } catch (e) {
      console.error("[trial-varsel] feilet:", e instanceof Error ? e.message : e);
    }
  }
  await markerTrialPaminnelseSendt(trialSendt);

  return NextResponse.json({ ok: true, funnet: liste.length, sendt, trialVarsler: trialSendt.length });
}

export async function POST(req: NextRequest) {
  return kjor(req);
}

// Tillat GET også, så en enkel cron (cron-job.org) kan treffe URL-en med ?key=…
export async function GET(req: NextRequest) {
  return kjor(req);
}
