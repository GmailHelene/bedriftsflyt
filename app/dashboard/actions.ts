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
  kansellerBookingForBedrift,
} from "@/lib/repository";
import { opprettTrekk } from "@/lib/vipps-recurring";

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
  if (!beskrivelse || belopKr <= 0) return;
  await opprettFaktura(slug, { beskrivelse, belopKr });
  revalidatePath("/dashboard");
}

// Dev/test-snarvei for å se skatt-avsetningen uten live Vipps. I produksjon skjer dette via webhook.
export async function markerBetaltTest(formData: FormData) {
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
