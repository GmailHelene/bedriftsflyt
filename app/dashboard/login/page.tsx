export default function Login({
  searchParams,
}: {
  searchParams: { feil?: string };
}) {
  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        Bedriftsflyt
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h1>Logg inn</h1>

        {searchParams.feil === "vipps" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>
            Vipps Login er ikke konfigurert ennå. Bruk dev-innlogging under.
          </p>
        )}
        {searchParams.feil === "1" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>
            Innloggingen ble avbrutt. Prøv igjen.
          </p>
        )}

        {/* Ekte, passordløs innlogging */}
        <a
          href="/api/auth/vipps"
          className="btn"
          style={{ marginTop: 14, textDecoration: "none", background: "#FF5B24" }}
        >
          Logg inn med Vipps
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 12px", color: "var(--muted)", fontSize: 12 }}>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          eller dev-innlogging
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        {searchParams.feil === "dev" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginBottom: 8 }}>
            Feil bedrift-slug eller passord.
          </p>
        )}

        <form
          method="post"
          action="/api/login"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input name="slug" placeholder="Bedrift-slug (f.eks. silje)" required style={inputStyle} aria-label="Bedrift-slug" />
          <input name="passord" type="password" placeholder="Dev-passord" required style={inputStyle} aria-label="Passord" />
          <button className="btn btn-ghost" type="submit">
            Logg inn (dev)
          </button>
        </form>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Dev-innlogging er midlertidig, for lokal testing uten Vipps-nøkler.
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 15,
  fontFamily: "inherit",
};
