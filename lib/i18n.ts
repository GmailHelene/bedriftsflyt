// Enkel to-språks-ordbok for den offentlige kundesiden (NO/EN).
export type Lang = "no" | "en";

export function parseLang(v?: string): Lang {
  return v === "en" ? "en" : "no";
}

type BekreftInput = { navn: string; tjeneste: string; dato: string; tid: string; bedrift: string; epost: string };

export type Tekster = {
  datoLocale: string;
  // profil
  verifisert: string;
  vurderinger: string;
  // booking
  velgBehandling: string;
  velgDag: string;
  velgTid: string;
  dineOpplysninger: string;
  navn: string;
  mobil: string;
  epost: string;
  idag: string;
  min: string;
  henterTider: string;
  ingenTider: string;
  ingenKonto: string;
  bekreftetTittel: string;
  feilGenerisk: string;
  nettverksfeil: string;
  velgEnBehandling: string;
  velgEnDag: string;
  velgEnTid: string;
  fyllNavn: string;
  booker: string;
  book: (tjeneste: string, tid: string) => string;
  bekreftet: (p: BekreftInput) => string;
  // chat
  sporOss: string;
  lukk: string;
  apneChat: string;
  lukkChat: string;
  chatSub: string;
  chatAssistent: string;
  chatHilsen: string;
  skrivMelding: string;
  send: string;
  forslag: string[];
  feilChat: string;
  nettChat: string;
};

const NO: Tekster = {
  datoLocale: "nb-NO",
  verifisert: "✓ Verifisert",
  vurderinger: "vurderinger",
  velgBehandling: "Velg behandling",
  velgDag: "Velg dag",
  velgTid: "Velg tid",
  dineOpplysninger: "Dine opplysninger",
  navn: "Navn",
  mobil: "Mobil",
  epost: "E-post",
  idag: "I dag",
  min: "min",
  henterTider: "Henter ledige tider …",
  ingenTider: "Ingen ledige tider denne dagen. Prøv en annen dag.",
  ingenKonto: "Ingen konto nødvendig. Vi bruker opplysningene kun til denne bookingen.",
  bekreftetTittel: "✓ Booking bekreftet",
  feilGenerisk: "Noe gikk galt. Prøv igjen.",
  nettverksfeil: "Nettverksfeil. Prøv igjen.",
  velgEnBehandling: "Velg en behandling",
  velgEnDag: "Velg en dag",
  velgEnTid: "Velg en tid",
  fyllNavn: "Fyll inn navn",
  booker: "Booker …",
  book: (t, tid) => `Book ${t} · kl ${tid}`,
  bekreftet: (p) =>
    `${p.navn}, du er booket for ${p.tjeneste.toLowerCase()} ${p.dato} kl ${p.tid} hos ${p.bedrift}. Vi sender en bekreftelse${
      p.epost ? ` til ${p.epost}` : ""
    }.`,
  sporOss: "Spør oss",
  lukk: "Lukk",
  apneChat: "Åpne chat",
  lukkChat: "Lukk chat",
  chatSub: "Svarer med en gang · KI",
  chatAssistent: "assistent",
  chatHilsen: "Hei! Jeg er assistenten her. Spør meg om priser, tider, sted eller avbestilling.",
  skrivMelding: "Skriv en melding …",
  send: "Send",
  forslag: ["Hva koster det?", "Hvor lang tid tar det?", "Kan jeg avbestille?", "Tar dere nye kunder?"],
  feilChat: "Beklager, noe gikk galt. Kontakt oss gjerne direkte.",
  nettChat: "Nettverksfeil. Prøv igjen om litt.",
};

const EN: Tekster = {
  datoLocale: "en-GB",
  verifisert: "✓ Verified",
  vurderinger: "reviews",
  velgBehandling: "Choose a service",
  velgDag: "Choose a day",
  velgTid: "Choose a time",
  dineOpplysninger: "Your details",
  navn: "Name",
  mobil: "Mobile",
  epost: "Email",
  idag: "Today",
  min: "min",
  henterTider: "Loading available times …",
  ingenTider: "No available times this day. Try another day.",
  ingenKonto: "No account needed. We only use your details for this booking.",
  bekreftetTittel: "✓ Booking confirmed",
  feilGenerisk: "Something went wrong. Try again.",
  nettverksfeil: "Network error. Try again.",
  velgEnBehandling: "Select a service",
  velgEnDag: "Select a day",
  velgEnTid: "Select a time",
  fyllNavn: "Enter your name",
  booker: "Booking …",
  book: (t, tid) => `Book ${t} · ${tid}`,
  bekreftet: (p) =>
    `${p.navn}, you're booked for ${p.tjeneste.toLowerCase()} on ${p.dato} at ${p.tid} with ${p.bedrift}. We'll send a confirmation${
      p.epost ? ` to ${p.epost}` : ""
    }.`,
  sporOss: "Ask us",
  lukk: "Close",
  apneChat: "Open chat",
  lukkChat: "Close chat",
  chatSub: "Replies instantly · AI",
  chatAssistent: "assistant",
  chatHilsen: "Hi! I'm the assistant here. Ask me about prices, times, location or cancellation.",
  skrivMelding: "Type a message …",
  send: "Send",
  forslag: ["What does it cost?", "How long does it take?", "Can I cancel?", "Do you take new customers?"],
  feilChat: "Sorry, something went wrong. Feel free to contact us directly.",
  nettChat: "Network error. Try again shortly.",
};

export function tekster(lang: Lang): Tekster {
  return lang === "en" ? EN : NO;
}
