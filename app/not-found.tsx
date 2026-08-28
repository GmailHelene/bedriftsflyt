import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
        gap: 14,
      }}
    >
      <div className="brand" style={{ fontSize: 20 }}>
        <span className="mark" aria-hidden="true" />
        Bedriftsflyt
      </div>
      <h1 style={{ margin: 0, fontSize: 22 }}>Siden finnes ikke</h1>
      <p className="muted" style={{ maxWidth: "36ch" }}>
        Lenken er feil, eller siden er flyttet.
      </p>
      <Link href="/" className="btn" style={{ width: "auto", padding: "10px 20px", textDecoration: "none" }}>
        Til forsiden
      </Link>
    </main>
  );
}
