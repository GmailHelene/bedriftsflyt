"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionSlug, SESSION_COOKIE, VIPPS_SUB_COOKIE } from "@/lib/auth";
import {
  oppdaterProfil,
  leggTilTjeneste,
  slettTjeneste,
  opprettFaktura,
  markerFakturaBetalt,
  koblEierTilBedrift,
  hentAbonnement,
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

// Vipps Login: kobler den verifiserte Vipps-brukeren til bedriften og logger inn.
export async function kobleEier(formData: FormData) {
  const sub = cookies().get(VIPPS_SUB_COOKIE)?.value;
  if (!sub) redirect("/dashboard/login");
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  const ok = await koblEierTilBedrift(sub, slug);
  if (!ok) redirect("/dashboard/koble?feil=1");

  cookies().set(SESSION_COOKIE, slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().delete(VIPPS_SUB_COOKIE);
  redirect("/dashboard");
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
