// Midlertidig mock-data (Milepæl 1-3). Erstattes av Supabase i Milepæl 2.

export type Tjeneste = {
  id: string;
  navn: string;
  prisKr: number;
  varighetMin: number;
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
};

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
  },
];

export function getBedrift(slug: string): Bedrift | null {
  return bedrifter.find((b) => b.slug === slug) ?? null;
}
