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
