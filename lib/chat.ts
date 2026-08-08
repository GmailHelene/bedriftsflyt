// KI-kundechatbot (Milepæl 5). Server-side Claude — API-nøkkelen forlater aldri serveren.
import Anthropic from "@anthropic-ai/sdk";
import type { Bedrift } from "./mockData";
import type { ChatbotConfig } from "./repository";
import type { Lang } from "./i18n";

export function harKI(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type ChatMelding = { role: "user" | "assistant"; content: string };

function systemPrompt(b: Bedrift, c: ChatbotConfig, sprak: Lang): string {
  const tjenester = b.tjenester
    .map((t) => `- ${t.navn}: ${t.prisKr.toLocaleString("nb-NO")} kr, ${t.varighetMin} min`)
    .join("\n");
  const kontakt = b.navn.split("·")[0].trim();
  const apningstider = c.apningstider?.trim() || "mandag–lørdag 09–17 (søndag stengt)";
  const adresse = c.adressePolicy?.trim() || "sendes på SMS dagen før timen";
  const avbestilling = c.avbestilling?.trim() || "gratis frem til 24 timer før timen";
  const tone = c.tone?.trim() || "vennlig og uformell";
  const faq = c.faq?.trim()
    ? `\n\nVanlige spørsmål (svar naturlig, også om kunden spør annerledes):\n${c.faq.trim()}`
    : "";

  return `Du er kundeservice-assistenten til «${b.navn}» i ${b.sted}, og svarer på vegne av bedriften.

FAKTA du kan bruke:
Tjenester og priser:
${tjenester}
Åpningstider: ${apningstider}.
Booking: kunden booker selv på nettsiden ved å velge behandling og en ledig tid.
Avbestilling: ${avbestilling}.
Adresse: ${adresse}.${faq}

REGLER:
- ${sprak === "en" ? "Answer in English" : "Svar på norsk"}, kort, i en ${tone} tone. Maks 3–4 setninger.
- Bruk KUN fakta over. Vet du ikke svaret, si det ærlig og tilby at kunden kan ringe, sende e-post, eller be om å bli kontaktet av ${kontakt}.
- Ikke gi medisinske eller helsemessige råd.
- Ikke lov noe du ikke vet (spesifikke tider utover det systemet viser, tilbud, garantier).
- Du er en KI-assistent. Sier noen ifra eller spør, vær åpen om det.`;
}

export async function svarKunde(
  b: Bedrift,
  melding: string,
  historikk: ChatMelding[] = [],
  config: ChatbotConfig = {},
  sprak: Lang = "no"
): Promise<string> {
  const client = new Anthropic(); // leser ANTHROPIC_API_KEY fra miljøet
  const meldinger: ChatMelding[] = [...historikk.slice(-6), { role: "user", content: melding }];

  const res = await client.messages.create({
    model: "claude-haiku-4-5", // billig + rask for FAQ; bytt til claude-opus-5 for høyere kvalitet
    max_tokens: 500,
    system: systemPrompt(b, config, sprak),
    messages: meldinger,
  });

  const blokk = res.content.find((c) => c.type === "text");
  if (blokk && blokk.type === "text") return blokk.text;
  return "Beklager, jeg klarte ikke å svare akkurat nå. Prøv igjen, eller kontakt oss direkte.";
}
