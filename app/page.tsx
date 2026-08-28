import Link from "next/link";

// Forsiden er bevisst enkel: bare velkomst + innlogging/registrering.
// Selve salgsteksten (priser, funksjoner, målgrupper) ligger kun på
// kundebox.no/bedriftsflyt.html, ikke duplisert her.

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
        padding: "40px 20px",
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
      <nav style={{ marginTop: 20, display: "flex", gap: 16, fontSize: 13 }}>
        <Link href="/vilkar" className="muted">
          Salgsvilkår
        </Link>
        <Link href="/personvern" className="muted">
          Personvern
        </Link>
      </nav>
    </main>
  );
}
