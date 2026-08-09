import Link from "next/link";
import { KalenderIkon, KortIkon, ChatIkon, ProsentIkon, SkjoldIkon, MerkelappIkon } from "../icons";

export const metadata = {
  title: "Bedriftsflyt for håndverkere",
  description: "Befaring, tilbud, faktura og betaling med Vipps, samlet på ett sted. For snekkere, montører og småbedrifter.",
};

const container: React.CSSProperties = { maxWidth: 1040, margin: "0 auto", padding: "0 20px" };

// Stålblått bransjetema (ikke rosa). color-mix holder det lesbart i lys/mørk.
const tema = {
  ["--accent"]: "#1f5f8b",
  ["--accent-ink"]: "color-mix(in srgb, #1f5f8b 60%, var(--ink))",
  ["--accent-soft"]: "color-mix(in srgb, #1f5f8b 16%, var(--surface))",
} as React.CSSProperties;

export default function Handverker() {
  return (
    <main style={tema}>
      {/* Nav */}
      <header style={{ ...container, display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          Bedriftsflyt
        </div>
        <nav style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/modum-bygg" className="muted" style={{ fontSize: 14 }}>
            Se eksempel
          </Link>
          <Link href="/dashboard/login" className="btn" style={{ width: "auto", padding: "10px 16px", textDecoration: "none" }}>
            Logg inn
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ ...container, textAlign: "center", padding: "56px 20px 44px" }}>
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
          For håndverkere og småbedrifter
        </span>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 48px)", lineHeight: 1.1, margin: "18px auto 14px", maxWidth: "17ch" }}>
          Mindre papirarbeid. Mer tid på jobben.
        </h1>
        <p className="muted" style={{ fontSize: "clamp(16px, 2.4vw, 19px)", maxWidth: "54ch", margin: "0 auto" }}>
          Befaring, tilbud, faktura og betaling med Vipps, samlet på ett sted. Kundene booker befaring selv, og du
          slipper å jage betaling om kveldene.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
          <Link href="/dashboard/login" className="btn" style={{ width: "auto", padding: "14px 26px", textDecoration: "none" }}>
            Kom i gang
          </Link>
          <Link href="/modum-bygg" className="btn btn-ghost" style={{ width: "auto", padding: "14px 26px", textDecoration: "none" }}>
            Se en ekte profil →
          </Link>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          389 kr/mnd · 14 dager gratis · ingen bindingstid
        </p>
      </section>

      {/* Slik funker det */}
      <section style={{ ...container, padding: "24px 20px 8px" }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Slik funker det</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            ["1", "Legg inn tjenestene dine", "Timepris, montering, befaring. Du får en delbar lenke og QR-kode til bilen og profilene dine."],
            ["2", "Kunden booker befaring selv", "Legg lenka på Google og Facebook. Folk velger tid uten SMS-runder frem og tilbake."],
            ["3", "Send faktura, få betalt", "Kunden betaler med Vipps, og skatten settes av automatisk. Ingen mer roting i kladdeblokka."],
          ].map(([n, t, d]) => (
            <div key={n} className="card" style={{ padding: 22 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: "var(--accent-soft)",
                  color: "var(--accent-ink)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontFamily: "Georgia, serif",
                }}
              >
                {n}
              </div>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 17, margin: "12px 0 6px" }}>{t}</h3>
              <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funksjoner */}
      <section style={{ ...container, padding: "40px 20px 8px" }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Alt samlet</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { Ikon: KalenderIkon, tittel: "Booking av befaring", tekst: "Ledige tider beregnes automatisk. Ingen dobbeltbooking." },
            { Ikon: KortIkon, tittel: "Faktura + Vipps", tekst: "Send betalingslenke, bli betalt på sekunder." },
            { Ikon: ChatIkon, tittel: "KI svarer kunder", tekst: "Om priser, ledige tider og hva du tar på deg, døgnet rundt." },
            { Ikon: ProsentIkon, tittel: "Auto skatt-avsetning", tekst: "35 % settes til side automatisk. Ingen vårlige overraskelser." },
            { Ikon: SkjoldIkon, tittel: "Verifisert profil", tekst: "BankID-verifisert med Vipps. Trygt for kundene." },
            { Ikon: MerkelappIkon, tittel: "Ingen lead-avgift", tekst: "Flat pris. Vi tar aldri betalt per kunde eller per jobb." },
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
            <Link href="/skjonnhet" className="muted">Skjønnhet og velvære</Link>
            <Link href="/vilkar" className="muted">Salgsvilkår</Link>
            <Link href="/personvern" className="muted">Personvern</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
