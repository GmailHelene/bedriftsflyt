import Link from "next/link";
import {
  KalenderIkon,
  KortIkon,
  ChatIkon,
  ProsentIkon,
  SkjoldIkon,
  MerkelappIkon,
  StjerneIkon,
  VerktoyIkon,
} from "./icons";

const container: React.CSSProperties = { maxWidth: 1040, margin: "0 auto", padding: "0 20px" };

// Nøytralt skifer-tema på forsiden (ikke rosa). Bransjefargene lever i hvert sitt kort.
const noytralTema = {
  ["--accent"]: "#3b4a63",
  ["--accent-ink"]: "color-mix(in srgb, #3b4a63 62%, var(--ink))",
  ["--accent-soft"]: "color-mix(in srgb, #3b4a63 15%, var(--surface))",
} as React.CSSProperties;

const berryTema = {
  ["--accent"]: "#c0466e",
  ["--accent-ink"]: "color-mix(in srgb, #c0466e 60%, var(--ink))",
  ["--accent-soft"]: "color-mix(in srgb, #c0466e 16%, var(--surface))",
} as React.CSSProperties;

const blaTema = {
  ["--accent"]: "#1f5f8b",
  ["--accent-ink"]: "color-mix(in srgb, #1f5f8b 60%, var(--ink))",
  ["--accent-soft"]: "color-mix(in srgb, #1f5f8b 16%, var(--surface))",
} as React.CSSProperties;

const bransjer = [
  {
    Ikon: StjerneIkon,
    tittel: "Skjønnhet og velvære",
    beskrivelse: "Vipper, negler, hår, hud og massasje. Kundene booker selv, du slipper DM-maset.",
    href: "/skjonnhet",
    eksempel: "/silje",
    tema: berryTema,
  },
  {
    Ikon: VerktoyIkon,
    tittel: "Håndverk og bygg",
    beskrivelse: "Snekker, montør, maler, elektriker. Befaring, tilbud og faktura på ett sted.",
    href: "/handverker",
    eksempel: "/modum-bygg",
    tema: blaTema,
  },
];

export default function Home() {
  return (
    <main style={noytralTema}>
      {/* Nav */}
      <header style={{ ...container, display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          Bedriftsflyt
        </div>
        <nav style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard/login" className="btn" style={{ width: "auto", padding: "10px 16px", textDecoration: "none" }}>
            Logg inn
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ ...container, textAlign: "center", padding: "56px 20px 36px" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--accent-ink)",
            background: "var(--accent-soft)",
            padding: "5px 12px",
            borderRadius: 999,
          }}
        >
          For deg som driver alene
        </span>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 48px)", lineHeight: 1.1, margin: "18px auto 14px", maxWidth: "16ch" }}>
          Alt du trenger for å drive - på ett sted
        </h1>
        <p className="muted" style={{ fontSize: "clamp(16px, 2.4vw, 19px)", maxWidth: "54ch", margin: "0 auto" }}>
          Booking, faktura, betaling med Vipps og en KI som svarer kundene dine. Så slipper du å bruke kveldene på
          papirarbeid.
        </p>
      </section>

      {/* Velg bransje */}
      <section style={{ ...container, padding: "8px 20px 8px" }}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Hva driver du med?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {bransjer.map(({ Ikon, tittel, beskrivelse, href, eksempel, tema }) => (
            <div
              key={tittel}
              className="card"
              style={{ padding: 26, display: "flex", flexDirection: "column", gap: 10, ...(tema ?? {}) }}
            >
              <div style={{ color: "var(--accent-ink)" }}>
                <Ikon size={30} />
              </div>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: 0 }}>{tittel}</h3>
              <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55 }}>{beskrivelse}</p>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: "auto", paddingTop: 10, flexWrap: "wrap" }}>
                <Link href={href} className="btn" style={{ width: "auto", padding: "12px 20px", textDecoration: "none" }}>
                  Utforsk →
                </Link>
                <Link href={eksempel} className="muted" style={{ fontSize: 14 }}>
                  Se eksempel →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ textAlign: "center", fontSize: 13, marginTop: 18 }}>
          389 kr/mnd · 14 dager gratis · ingen bindingstid
        </p>
      </section>

      {/* Funksjoner (felles) */}
      <section style={{ ...container, padding: "44px 20px 8px" }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Alt samlet, uansett bransje</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { Ikon: KalenderIkon, tittel: "Booking", tekst: "Ledige tider beregnes automatisk. Ingen dobbeltbooking." },
            { Ikon: KortIkon, tittel: "Faktura + Vipps", tekst: "Send betalingslenke, bli betalt på sekunder." },
            { Ikon: ChatIkon, tittel: "KI-kundechatbot", tekst: "Svarer kunder om priser og tider, døgnet rundt." },
            { Ikon: ProsentIkon, tittel: "Auto skatt-avsetning", tekst: "35 % settes til side automatisk. Ingen vårlige overraskelser." },
            { Ikon: SkjoldIkon, tittel: "Verifisert profil", tekst: "BankID-verifisert med Vipps. Trygt for kundene." },
            { Ikon: MerkelappIkon, tittel: "Ingen lead-avgift", tekst: "Flat pris. Vi tar aldri betalt per kunde." },
          ].map(({ Ikon, tittel, tekst }) => (
            <div key={tittel} className="card" style={{ padding: 18 }}>
              <div style={{ color: "var(--accent-ink)" }}>
                <Ikon size={24} />
              </div>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, margin: "10px 0 4px" }}>{tittel}</h3>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>{tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pris */}
      <section style={{ ...container, padding: "44px 20px" }}>
        <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 460, margin: "0 auto", borderColor: "var(--accent)" }}>
          <h2>Én pris, alt inkludert</h2>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 600, color: "var(--accent-ink)", margin: "8px 0" }}>
            389 kr<span style={{ fontSize: 18, color: "var(--muted)" }}>/mnd</span>
          </div>
          <p className="muted" style={{ marginBottom: 18 }}>14 dager gratis. Ingen bindingstid, si opp når som helst.</p>
          <Link href="/dashboard/login" className="btn" style={{ textDecoration: "none" }}>
            Kom i gang med Vipps
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--line)", marginTop: 20 }}>
        <div style={{ ...container, padding: "22px 20px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div className="brand" style={{ fontSize: 16 }}>
            <span className="mark" aria-hidden="true" />
            Bedriftsflyt
          </div>
          <nav style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 13 }}>
            <Link href="/skjonnhet" className="muted">Skjønnhet</Link>
            <Link href="/handverker" className="muted">Håndverk</Link>
            <Link href="/vilkar" className="muted">Salgsvilkår</Link>
            <Link href="/personvern" className="muted">Personvern</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
