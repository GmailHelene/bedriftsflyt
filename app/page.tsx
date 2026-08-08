import Link from "next/link";

export default function Home() {
  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        Bedriftsflyt
      </div>

      <h1 style={{ marginTop: 28 }}>Booking, faktura og kundesvar på ett sted</h1>
      <p className="muted" style={{ fontSize: 16, maxWidth: "52ch" }}>
        For deg som driver alene. Så slipper du å bruke kveldene på papirarbeid.
      </p>

      <div className="card" style={{ marginTop: 24, padding: 20 }}>
        <h2>Eksempelprofil</h2>
        <p className="muted">Slik ser kunden deg. Klikk for å prøve booking:</p>
        <Link className="btn" href="/silje" style={{ marginTop: 12, textDecoration: "none" }}>
          Åpne Silje · Vipper &amp; Bryn →
        </Link>
      </div>
    </main>
  );
}
