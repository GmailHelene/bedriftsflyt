import Link from "next/link";
import { loggInnMedEpost } from "../actions";

export const metadata = { title: "Logg inn · Bedriftsflyt" };

// Nøytralt skifer-tema (ikke rosa) på innloggingssidene.
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

export default function Login({
  searchParams,
}: {
  searchParams: { feil?: string; nullstilt?: string };
}) {
  return (
    <main className="wrap" style={noytralTema}>
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Bedriftsflyt</Link>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h1>Logg inn</h1>

        {searchParams.nullstilt === "1" && (
          <p style={{ color: "var(--good)", fontWeight: 600, marginTop: 10 }}>Passordet er endret. Logg inn under.</p>
        )}
        {searchParams.feil === "epost" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>Feil e-post eller passord.</p>
        )}
        {searchParams.feil === "server" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>Databasefeil. Prøv igjen om litt.</p>
        )}
        {searchParams.feil === "sesjon" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>
            Server-konfigurasjon mangler (SESSION_SECRET).
          </p>
        )}
        {searchParams.feil === "vipps" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>Vipps Login er ikke konfigurert ennå.</p>
        )}
        {searchParams.feil === "1" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>Innloggingen ble avbrutt. Prøv igjen.</p>
        )}
        {searchParams.feil === "for-mange-forsok" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>For mange forsøk. Vent litt før du prøver igjen.</p>
        )}

        <form action={loggInnMedEpost} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          <input name="epost" type="email" placeholder="E-post" required style={inputStyle} aria-label="E-post" />
          <input name="passord" type="password" placeholder="Passord" required style={inputStyle} aria-label="Passord" />
          <button className="btn" type="submit">Logg inn</button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 14 }}>
          <Link href="/dashboard/registrer" className="muted">Opprett konto</Link>
          <Link href="/dashboard/glemt" className="muted">Glemt passord?</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 12px", color: "var(--muted)", fontSize: 12 }}>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          eller
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <a href="/api/auth/vipps" className="btn" style={{ textDecoration: "none", background: "#FF5B24" }}>
          Logg inn med Vipps
        </a>
      </div>
    </main>
  );
}
