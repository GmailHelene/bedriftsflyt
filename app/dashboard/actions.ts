"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionSlug, SESSION_COOKIE, VIPPS_SUB_COOKIE, signerSlug } from "@/lib/auth";
import {
  oppdaterProfil,
  leggTilTjeneste,
  slettTjeneste,
  opprettFaktura,
  markerFakturaBetalt,
  opprettBedrift,
  hentAbonnement,
  settChatbotConfig,
  oppdaterKundeNotat,
  settApningstider,
  settDepositum,
  settAnmeldelseUrl,
  settVarselEpost,
  kansellerBookingForBedrift,
  opprettBedriftMedPassord,
  finnBedriftMedEpost,
  settPassord,
  settLoginOpplysninger,
  settProfilbilde,
  leggTilGalleribilde,
  slettGalleribilde,
  settMerkefarge,
  settFakturaOpplysninger,
} from "@/lib/repository";
import { opprettTrekk } from "@/lib/vipps-recurring";
import { hashPassord, verifiserPassord } from "@/lib/passord";
import { signerReset, verifiserReset } from "@/lib/token";
import { sendEpost } from "@/lib/email";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[æå]/g, "a")
      .replace(/ø/g, "o")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tjeneste"
  );
}

export async function lagreProfil(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await oppdaterProfil(slug, {
    navn: String(formData.get("navn") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    sted: String(formData.get("sted") ?? "").trim(),
  });
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}

export async function nyTjeneste(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const navn = String(formData.get("navn") ?? "").trim();
  if (!navn) return;
  await leggTilTjeneste(slug, {
    id: slugify(navn),
    navn,
    prisKr: Math.max(0, Number(formData.get("pris") ?? 0)),
    varighetMin: Math.max(5, Number(formData.get("varighet") ?? 30)),
  });
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}

export async function fjernTjeneste(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await slettTjeneste(slug, String(formData.get("id") ?? ""));
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}

export async function nyFaktura(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const beskrivelse = String(formData.get("beskrivelse") ?? "").trim();
  const belopKr = Math.max(0, Number(formData.get("belop") ?? 0));
  const kjoperNavn = String(formData.get("kjoper") ?? "").trim();
  if (!beskrivelse || belopKr <= 0) return;
  await opprettFaktura(slug, { beskrivelse, belopKr, kjoperNavn });
  revalidatePath("/dashboard");
}

// Fakturaopplysninger for bedriften (org.nr, mva-status, betalingsinfo).
export async function lagreFakturaOpplysninger(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await settFakturaOpplysninger(slug, {
    orgNr: String(formData.get("org_nr") ?? "").trim(),
    mvaRegistrert: formData.get("mva_registrert") === "on",
    betalingsinfo: String(formData.get("betalingsinfo") ?? "").trim(),
  });
  revalidatePath("/dashboard/oppsett");
  redirect("/dashboard/oppsett?lagret=faktura");
}

// Dev/test-snarvei for å se skatt-avsetningen uten live Vipps. I produksjon skjer dette via webhook.
// Vokter server-side, ikke bare i UI: i produksjon skal en ekte betaling ALLTID gå via Vipps,
// slik at ingen kan markere en faktura som betalt uten reell betaling. Krev NODE_ENV != production,
// og la ALLOW_TEST_BETALT="1" åpne den eksplisitt i et ikke-prod testmiljø ved behov.
export async function markerBetaltTest(formData: FormData) {
  const testTillatt = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_BETALT === "1";
  if (!testTillatt) {
    console.warn("[markerBetaltTest] Avvist i produksjon - betaling må gå via Vipps.");
    redirect("/dashboard");
  }
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const reference = String(formData.get("reference") ?? "");
  if (reference) await markerFakturaBetalt(reference);
  revalidatePath("/dashboard");
}

// Selvbetjent registrering: Vipps-verifisert eier oppretter bedriften sin og logges inn.
export async function registrerBedrift(formData: FormData) {
  const sub = cookies().get(VIPPS_SUB_COOKIE)?.value;
  if (!sub) redirect("/dashboard/login");

  const navn = String(formData.get("navn") ?? "").trim();
  const sted = String(formData.get("sted") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/æ/g, "a")
    .replace(/å/g, "a")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  if (!navn || !slug) redirect("/dashboard/koble?feil=felt");

  const res = await opprettBedrift({ navn, sted, slug, ownerSub: sub });
  if (!res.ok) redirect(`/dashboard/koble?feil=${res.grunn === "opptatt" ? "slug" : "ugyldig"}`);

  // Valgfritt: e-post + passord, så de også kan logge inn uten Vipps neste gang (best-effort).
  const epost = String(formData.get("epost") ?? "").trim();
  const passord = String(formData.get("passord") ?? "");
  if (epost || passord.length >= 8) {
    try {
      await settLoginOpplysninger(slug, {
        epost: epost || undefined,
        passordHash: passord.length >= 8 ? hashPassord(passord) : undefined,
      });
    } catch {
      /* ignorer - bedriften er allerede opprettet via Vipps */
    }
  }

  cookies().set(SESSION_COOKIE, signerSlug(slug), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().delete(VIPPS_SUB_COOKIE);
  redirect("/dashboard");
}

// Sett/oppdater innlogging (e-post + passord) fra Innstillinger - virker for både Vipps- og e-postkontoer.
export async function lagreInnlogging(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const epost = String(formData.get("epost") ?? "").trim();
  const passord = String(formData.get("passord") ?? "");
  if (passord && passord.length < 8) redirect("/dashboard/oppsett?feil=passord");
  const res = await settLoginOpplysninger(slug, {
    epost: epost || undefined,
    passordHash: passord.length >= 8 ? hashPassord(passord) : undefined,
  });
  if (!res.ok) redirect(`/dashboard/oppsett?feil=${res.grunn ?? "innlogging"}`);
  redirect("/dashboard/oppsett?lagret=innlogging");
}

// Lagre hva KI-chatboten skal svare kundene (åpningstider, adresse, avbestilling, tone, FAQ).
export async function lagreOppsett(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await settChatbotConfig(slug, {
    adressePolicy: String(formData.get("adresse") ?? "").trim(),
    avbestilling: String(formData.get("avbestilling") ?? "").trim(),
    tone: String(formData.get("tone") ?? "").trim(),
    faq: String(formData.get("faq") ?? "").trim(),
  });
  revalidatePath("/dashboard/oppsett");
  redirect("/dashboard/oppsett?lagret=1");
}

// Åpningstider (styrer både booking-kalenderen og hva chatboten svarer).
export async function lagreApningstider(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const fra = String(formData.get("fra") ?? "09:00");
  const til = String(formData.get("til") ?? "17:00");
  const dager = formData
    .getAll("dager")
    .map((d) => Number(d))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  await settApningstider(slug, { fra, til, dager });
  revalidatePath("/dashboard/oppsett");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/oppsett?lagret=tider");
}

// Valgfritt depositum ved booking (aktiveres når Vipps er live).
export async function lagreDepositum(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await settDepositum(slug, Math.max(0, Number(formData.get("depositum") ?? 0)));
  revalidatePath("/dashboard/oppsett");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/oppsett?lagret=depositum");
}

// Google-/anmeldelseslenke (synlighet-siden).
export async function lagreAnmeldelse(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await settAnmeldelseUrl(slug, String(formData.get("url") ?? "").trim());
  revalidatePath("/dashboard/synlighet");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/synlighet?lagret=1");
}

// E-post bedriften vil ha ny-booking-varsler til.
export async function lagreVarsel(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await settVarselEpost(slug, String(formData.get("varsel_epost") ?? "").trim());
  revalidatePath("/dashboard/oppsett");
  redirect("/dashboard/oppsett?lagret=varsel");
}

// ---- Utseende (profilbilde, galleri, merkefarge) ----

function gyldigBilde(s: string): boolean {
  // data:image/... og under ~520KB rå (base64 er ~1,37x, så < ~710k tegn).
  return s.startsWith("data:image/") && s.length < 710_000;
}

export async function lastOppProfilbilde(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const bilde = String(formData.get("bilde") ?? "");
  if (gyldigBilde(bilde)) await settProfilbilde(slug, bilde);
  revalidatePath("/dashboard/utseende");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/utseende?lagret=bilde");
}

export async function fjernProfilbilde() {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  await settProfilbilde(slug, null);
  revalidatePath("/dashboard/utseende");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/utseende");
}

export async function leggTilGalleri(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const bilde = String(formData.get("bilde") ?? "");
  if (gyldigBilde(bilde)) await leggTilGalleribilde(slug, bilde);
  revalidatePath("/dashboard/utseende");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/utseende?lagret=galleri");
}

export async function fjernGalleri(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const i = Number(formData.get("indeks") ?? -1);
  if (Number.isInteger(i) && i >= 0) await slettGalleribilde(slug, i);
  revalidatePath("/dashboard/utseende");
  revalidatePath(`/${slug}`);
}

export async function lagreMerkefarge(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const hex = String(formData.get("merkefarge") ?? "").trim();
  await settMerkefarge(slug, /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null);
  revalidatePath("/dashboard/utseende");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/utseende?lagret=farge");
}

// Bedriften avbestiller en booking fra dashbordet/kalenderen.
export async function kansellerBookingDash(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const id = String(formData.get("id") ?? "");
  if (id) await kansellerBookingForBedrift(slug, id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/kalender");
}

// Lagre et notat på en kunde (kundekort).
export async function lagreKundeNotat(formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const navn = String(formData.get("navn") ?? "").trim();
  const telefonRaw = String(formData.get("telefon") ?? "").trim();
  const notat = String(formData.get("notat") ?? "").trim();
  if (!navn) return;
  await oppdaterKundeNotat(slug, navn, telefonRaw || null, notat);
  revalidatePath("/dashboard/kunder");
}

// Logg ut via POST (ikke GET), så Next sin prefetch av lenker ikke sletter sesjonen ved et uhell.
export async function loggUt() {
  cookies().delete(SESSION_COOKIE);
  redirect("/dashboard/login");
}

function settSesjon(slug: string) {
  cookies().set(SESSION_COOKIE, signerSlug(slug), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

// Registrer ny bedrift med e-post + passord (alternativ til Vipps).
export async function registrerMedEpost(formData: FormData) {
  const navn = String(formData.get("navn") ?? "").trim();
  const sted = String(formData.get("sted") ?? "").trim();
  const epost = String(formData.get("epost") ?? "").trim();
  const passord = String(formData.get("passord") ?? "");
  const slug = slugify(String(formData.get("slug") ?? "").trim() || navn);
  if (!navn || !epost || passord.length < 8 || !slug) redirect("/dashboard/registrer?feil=felt");

  // DB-arbeid i egen try, så en uventet feil gir tydelig melding i stedet for en 500.
  let utfall: { ok: boolean; grunn?: string };
  try {
    utfall = await opprettBedriftMedPassord({ navn, sted, slug, epost, passordHash: hashPassord(passord) });
  } catch (e) {
    console.error("[registrer] oppretting feilet:", e instanceof Error ? e.message : e);
    utfall = { ok: false, grunn: "ugyldig" };
  }
  if (!utfall.ok) redirect(`/dashboard/registrer?feil=${utfall.grunn ?? "ugyldig"}`);

  // Velkomstmail (best-effort - skal aldri velte registreringen).
  try {
    const base = process.env.APP_BASE_URL || "";
    const profil = `${base}/${slug}`;
    await sendEpost({
      til: epost,
      emne: "Velkommen til Bedriftsflyt",
      html:
        `<p>Hei, og velkommen!</p>` +
        `<p>Bedriften din er opprettet. Din offentlige side er her:</p>` +
        `<p><a href="${profil}">${profil}</a></p>` +
        `<p>Kom i gang: legg inn tjenestene og prisene dine, sett åpningstider, og del lenka i Instagram-bio eller på Google. Du har 14 dager gratis, uten binding.</p>` +
        `<p>Lykke til!</p>`,
      tekst:
        `Hei, og velkommen!\n\nBedriften din er opprettet. Din side: ${profil}\n\n` +
        `Kom i gang: legg inn tjenester og priser, sett åpningstider, og del lenka. 14 dager gratis, uten binding.\n\nLykke til!`,
    });
  } catch {
    /* ignorer */
  }

  // Sesjonssignering (krever SESSION_SECRET i produksjon).
  try {
    settSesjon(slug);
  } catch (e) {
    console.error("[registrer] sesjon feilet - SESSION_SECRET satt i prod?", e instanceof Error ? e.message : e);
    redirect("/dashboard/registrer?feil=sesjon");
  }
  redirect("/dashboard");
}

// Logg inn med e-post + passord.
export async function loggInnMedEpost(formData: FormData) {
  const epost = String(formData.get("epost") ?? "").trim();
  const passord = String(formData.get("passord") ?? "");

  let funn: { slug: string; passordHash: string | null } | null = null;
  try {
    funn = await finnBedriftMedEpost(epost);
  } catch (e) {
    console.error("[login] oppslag feilet:", e instanceof Error ? e.message : e);
    redirect("/dashboard/login?feil=server");
  }
  if (!funn || !verifiserPassord(passord, funn.passordHash)) redirect("/dashboard/login?feil=epost");

  try {
    settSesjon(funn.slug);
  } catch (e) {
    console.error("[login] sesjon feilet - SESSION_SECRET satt i prod?", e instanceof Error ? e.message : e);
    redirect("/dashboard/login?feil=sesjon");
  }
  redirect("/dashboard");
}

// Glemt passord: send tilbakestillingslenke (samme svar uansett, ingen bruker-enumerering).
export async function sendTilbakestilling(formData: FormData) {
  const epost = String(formData.get("epost") ?? "").trim();
  const funn = await finnBedriftMedEpost(epost);
  if (funn) {
    const base = process.env.APP_BASE_URL || "";
    const lenke = `${base}/dashboard/nullstill/${signerReset(funn.slug)}`;
    try {
      await sendEpost({
        til: epost,
        emne: "Tilbakestill passordet ditt - Bedriftsflyt",
        html: `<p>Klikk for å velge nytt passord (lenken er gyldig i 1 time):</p><p><a href="${lenke}">${lenke}</a></p><p>Ba du ikke om dette, kan du se bort fra denne e-posten.</p>`,
        tekst: `Velg nytt passord (gyldig i 1 time): ${lenke}`,
      });
    } catch {
      /* ignore - vi avslører ikke om e-posten finnes */
    }
  }
  redirect("/dashboard/glemt?sendt=1");
}

// Sett nytt passord fra tilbakestillingslenke.
export async function settNyttPassord(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const passord = String(formData.get("passord") ?? "");
  const slug = verifiserReset(token);
  if (!slug) redirect(`/dashboard/nullstill/${encodeURIComponent(token)}?feil=token`);
  if (passord.length < 8) redirect(`/dashboard/nullstill/${encodeURIComponent(token)}?feil=kort`);
  await settPassord(slug, hashPassord(passord));
  redirect("/dashboard/login?nullstilt=1");
}

// Dev/test: kjør et månedstrekk manuelt (i produksjon gjøres dette av en planlagt jobb).
export async function kjorTrekk(_formData: FormData) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");
  const ab = await hentAbonnement(slug);
  if (ab.agreementId) {
    try {
      await opprettTrekk(ab.agreementId, { belopOre: 38900, beskrivelse: "Bedriftsflyt abonnement" });
    } catch {
      // ignorer i test
    }
  }
  revalidatePath("/dashboard");
}
