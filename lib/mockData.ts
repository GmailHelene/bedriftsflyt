// Midlertidig mock-data (Milepæl 1-3). Erstattes av Supabase i Milepæl 2.

export type Tjeneste = {
  id: string;
  navn: string;
  prisKr: number;
  varighetMin: number;
};

// Valgfritt fargetema per bedrift, så en profil kan tilpasses bransjen (ikke alt er rosa).
// Kun `accent` + cover-farger oppgis; resten utledes tema-trygt med color-mix (virker i lys/mørk).
export type Tema = {
  accent: string;
  coverFra: string;
  coverTil: string;
};

export type Apningstider = {
  fra: string; // "HH:MM"
  til: string; // "HH:MM"
  dager: number[]; // Postgres dow: 0=søn .. 6=lør
};

export type Bedrift = {
  slug: string;
  navn: string;
  tagline: string;
  sted: string;
  verifisert: boolean;
  rating: number;
  antallVurderinger: number;
  tjenester: Tjeneste[];
  ledigeTider: string[];
  apningstider: Apningstider;
  anmeldelseUrl?: string;
  depositumKr?: number;
  varselEpost?: string;
  tema?: Tema;
};

export const STANDARD_APNINGSTIDER: Apningstider = { fra: "09:00", til: "17:00", dager: [1, 2, 3, 4, 5, 6] };

export const bedrifter: Bedrift[] = [
  {
    slug: "silje",
    navn: "Silje · Vipper & Bryn",
    tagline: "Hjemmestudio · svarer vanligvis innen 1 t",
    sted: "Hamar",
    verifisert: true,
    rating: 4.9,
    antallVurderinger: 87,
    tjenester: [
      { id: "klassisk", navn: "Klassiske vipper – nytt sett", prisKr: 900, varighetMin: 90 },
      { id: "volum", navn: "Volumvipper – nytt sett", prisKr: 1200, varighetMin: 120 },
      { id: "pafyll", navn: "Påfyll vipper", prisKr: 650, varighetMin: 60 },
      { id: "bryn", navn: "Brynsløft", prisKr: 750, varighetMin: 60 },
    ],
    ledigeTider: ["09:00", "12:00", "14:00", "17:00"],
    apningstider: { fra: "09:00", til: "17:00", dager: [1, 2, 3, 4, 5, 6] },
  },
  {
    slug: "modum-bygg",
    navn: "Modum Bygg & Montering",
    tagline: "Snekker og montering · fast pris på befaring",
    sted: "Modum",
    verifisert: true,
    rating: 4.8,
    antallVurderinger: 41,
    tjenester: [
      { id: "befaring", navn: "Befaring og pristilbud", prisKr: 0, varighetMin: 45 },
      { id: "timepris", navn: "Snekkerarbeid – timepris", prisKr: 750, varighetMin: 60 },
      { id: "kjokken", navn: "Montering av kjøkken", prisKr: 8500, varighetMin: 480 },
      { id: "listverk", navn: "Listverk og innerdører", prisKr: 2500, varighetMin: 180 },
    ],
    ledigeTider: ["08:00", "10:00", "13:00", "15:00"],
    apningstider: { fra: "08:00", til: "16:00", dager: [1, 2, 3, 4, 5] },
    tema: { accent: "#1f5f8b", coverFra: "#4a90c2", coverTil: "#1c4a6b" },
  },
];

export function getBedrift(slug: string): Bedrift | null {
  return bedrifter.find((b) => b.slug === slug) ?? null;
}
