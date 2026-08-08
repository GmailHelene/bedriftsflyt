import Link from "next/link";
import { sendTilbakestilling } from "../actions";

export const metadata = { title: "Glemt passord · Bedriftsflyt" };

const noytralTema = {
  ["--accent"]: "#3b4a63",
  ["--accent-ink"]: "color-mix(in srgb, #3b4a63 62%, var(--ink))",
  ["--accent-soft"]: "color-mix(in srgb, #3b4a63 15%, var(--surface))",
} as React.CSSProperties;

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 15,
  fontFamily: "inherit",
  width: "100%",
};

export default function Glemt({
  searchParams,
}: {
  searchParams: { sendt?: string };
}) {
  return (
    <main className="wrap" style={noytralTema}>
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Bedriftsflyt</Link>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h1>Glemt passord</h1>

        {searchParams.sendt === "1" ? (
          <p className="muted" style={{ marginTop: 10 }}>
            Finnes det en konto med denne e-posten, har vi sendt en lenke for å velge nytt passord. Sjekk innboksen (og
            søppelpost).
          </p>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 4 }}>Skriv inn e-posten din, så sender vi en lenke for å velge nytt passord.</p>
            <form action={sendTilbakestilling} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <input name="epost" type="email" required placeholder="deg@epost.no" style={inputStyle} aria-label="E-post" />
              <button className="btn" type="submit">Send lenke</button>
            </form>
          </>
        )}

        <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>
          <Link href="/dashboard/login">← Tilbake til innlogging</Link>
        </p>
      </div>
    </main>
  );
}
