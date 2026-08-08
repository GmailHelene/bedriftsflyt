// KI-teksthjelp for bedriften (Instagram-post, SMS, svar på anmeldelse, Google-tekst).
import Anthropic from "@anthropic-ai/sdk";
import type { Bedrift } from "./mockData";

export function harKI(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type KomponerType = "instagram" | "sms" | "anmeldelse" | "google";

const OPPGAVER: Record<KomponerType, string> = {
  instagram:
    "Skriv et kort, fristende Instagram-innlegg (maks 4 setninger), med 3–5 relevante norske emneknagger til slutt.",
  sms: "Skriv en kort, høflig SMS til en kunde (maks 2 setninger, ingen emojier, ingen emneknagger).",
  anmeldelse: "Skriv et varmt og profesjonelt svar på en kundeanmeldelse (maks 3 setninger).",
  google: "Skriv en kort bedriftsbeskrivelse til Google Business-profilen (2–3 setninger).",
};

export async function komponer(
  b: Bedrift,
  type: KomponerType,
  kontekst: string,
  tone?: string
): Promise<string> {
  const client = new Anthropic();
  const tjenester = b.tjenester.map((t) => `${t.navn} (${t.prisKr.toLocaleString("nb-NO")} kr)`).join(", ");

  const system = `Du skriver markedstekst på vegne av «${b.navn}»${b.sted ? " i " + b.sted : ""}.
Tjenester: ${tjenester || "ikke oppgitt"}.
Tone: ${tone?.trim() || "vennlig, personlig og konkret"}.

Regler:
- Skriv på naturlig norsk. Varier setningslengden. Unngå AI-klisjeer og generisk fyll.
- Bruk vanlige bindestreker, ikke em-dash.
- Ikke finn på priser, tilbud eller påstander som ikke er nevnt.
- Svar med KUN selve teksten, uten forklaring eller anførselstegn rundt.`;

  const bruker = `${OPPGAVER[type]}${kontekst.trim() ? `\n\nKontekst fra bedriften: ${kontekst.trim()}` : ""}`;

  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    system,
    messages: [{ role: "user", content: bruker }],
  });

  const blokk = res.content.find((c) => c.type === "text");
  return blokk && blokk.type === "text" ? blokk.text.trim() : "Klarte ikke å generere tekst nå. Prøv igjen.";
}

// Foreslår chatbot-oppsettet (adresse, avbestilling, tone, FAQ) ut fra en kort beskrivelse.
export async function foreslaChatbotOppsett(
  b: Bedrift,
  beskrivelse: string
): Promise<{ adresse: string; avbestilling: string; tone: string; faq: string }> {
  const client = new Anthropic();
  const tjenester = b.tjenester.map((t) => `${t.navn} (${t.prisKr.toLocaleString("nb-NO")} kr)`).join(", ");

  const system = `Du hjelper en norsk solo-bedrift å sette opp kundechatboten sin. Ut fra en kort beskrivelse foreslår du fire felter.
Svar KUN med gyldig JSON: {"adresse": "...", "avbestilling": "...", "tone": "...", "faq": "..."}. Ingen forklaring, ingen markdown.
- adresse: kort setning om hvor kunden møter / adressepolicy.
- avbestilling: kort avbestillingsregel.
- tone: to-tre ord (f.eks. "vennlig og uformell").
- faq: 3-5 vanlige spørsmål med svar, ett per linje ("Spørsmål? Svar.").
Naturlig norsk, ingen AI-klisjeer, vanlige bindestreker. Ikke finn på priser eller fakta som ikke er nevnt.`;

  const bruker = `Bedrift: ${b.navn}${b.sted ? ", " + b.sted : ""}. Tjenester: ${tjenester || "ukjent"}.
Beskrivelse fra eier: ${beskrivelse}`;

  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 800,
    system,
    messages: [{ role: "user", content: bruker }],
  });

  const blokk = res.content.find((c) => c.type === "text");
  const tekst = blokk && blokk.type === "text" ? blokk.text : "{}";
  try {
    const start = tekst.indexOf("{");
    const slutt = tekst.lastIndexOf("}");
    const j = JSON.parse(tekst.slice(start, slutt + 1));
    return {
      adresse: String(j.adresse ?? ""),
      avbestilling: String(j.avbestilling ?? ""),
      tone: String(j.tone ?? ""),
      faq: String(j.faq ?? ""),
    };
  } catch {
    return { adresse: "", avbestilling: "", tone: "", faq: "" };
  }
}
