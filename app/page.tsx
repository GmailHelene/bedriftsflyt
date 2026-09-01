import Link from "next/link";

// Forsiden viser hva tjenesten er, hva den koster, og hvem som står bak.
// Dette er bevisst: Vipps kansellerte første søknad om Vipps på nett fordi
// siden manglet priser, tjenesteoversikt og synlig org.nr/kontaktinfo
// (29.08.2026). Den utfyllende salgsteksten ligger fortsatt på
// kundebox.no/bedriftsflyt.html, men det viktigste må være lesbart her.

const kort: React.CSSProperties = {
  border: "1px solid var(--line, #e4e0d8)",
  borderRadius: 12,
  padding: "20px 22px",
  textAlign: "left",
  maxWidth: 420,
  width: "100%",
};

export default function Home() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px 56px",
        gap: 18,
      }}
    >
      <a
        href="https://kundebox.no"
        style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#0f3b3f", fontWeight: 700, textDecoration: "none" }}
      >
        Del av Kundebox
      </a>
      <div className="brand" style={{ fontSize: 22 }}>
        <span className="mark" aria-hidden="true" />
        Bedriftsflyt
      </div>
      <p className="muted" style={{ maxWidth: "40ch", fontSize: 16, margin: 0 }}>
        Booking, faktura og skatteavsetning i ett verktøy, for deg som driver alene.
      </p>

      <div style={kort}>
        <p style={{ margin: "0 0 4px", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: "#616b76", fontWeight: 700 }}>
          Abonnement
        </p>
        <p style={{ margin: "0 0 14px", fontSize: 26, fontWeight: 700, color: "#16191d" }}>
          389 kr <span style={{ fontSize: 15, fontWeight: 400, color: "#616b76" }}>per måned</span>
        </p>
        <p className="muted" style={{ margin: "0 0 14px", fontSize: 14 }}>
          Gratis i 14 dager. Ingen bindingstid, og du sier opp selv i Vipps-appen når du vil.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.1em", fontSize: 14.5, lineHeight: 1.8, textAlign: "left" }}>
          <li>Booking med delbar lenke og QR-kode</li>
          <li>Faktura med betaling via Vipps</li>
          <li>Automatisk skatteanslag av hver betaling</li>
          <li>KI-assistent som svarer kundene dine</li>
        </ul>
      </div>

      <Link
        href="/dashboard/login"
        className="btn"
        style={{ width: "auto", padding: "12px 24px", textDecoration: "none" }}
      >
        Logg inn eller opprett konto
      </Link>
      <a href="https://kundebox.no/bedriftsflyt.html" className="muted" style={{ fontSize: 14 }}>
        Les mer om Bedriftsflyt på kundebox.no →
      </a>

      <nav style={{ marginTop: 20, display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/vilkar" className="muted">
          Salgsvilkår
        </Link>
        <Link href="/personvern" className="muted">
          Personvern
        </Link>
        <Link href="/databehandleravtale" className="muted">
          Databehandleravtale
        </Link>
      </nav>

      <address
        className="muted"
        style={{ marginTop: 14, fontSize: 13, fontStyle: "normal", lineHeight: 1.7 }}
      >
        Grønberg Tech Solutions · Org.nr 927 889 404 MVA<br />
        Modum, Norge · <a href="mailto:kontakt@helene.cloud">kontakt@helene.cloud</a> · <a href="tel:+4796912907">+47 969 12 907</a>
      </address>
    </main>
  );
}
