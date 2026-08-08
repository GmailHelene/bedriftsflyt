// Rene kalender-hjelpere. UTC-aritmetikk på «YYYY-MM-DD» → ingen tidssone-feil ved dag-adding.

export function leggTilDager(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function mandagFor(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = søndag
  const diff = dow === 0 ? -6 : 1 - dow;
  return leggTilDager(iso, diff);
}

const UKEDAGER = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];

export function ukedagNavn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return UKEDAGER[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function visDato(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}.${m}.`;
}

// Dagens dato i Oslo som «YYYY-MM-DD» (en-CA gir ISO-format).
export function idagOslo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(new Date());
}
