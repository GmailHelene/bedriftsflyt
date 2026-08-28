import Link from "next/link";
import { registrerMedEpost } from "../actions";

export const metadata = { title: "Opprett konto · Bedriftsflyt" };

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

const feilTekst: Record<string, string> = {
  felt: "Fyll inn navn, e-post og et passord på minst 8 tegn.",
  slug: "Den nettadressen er opptatt. Velg en annen.",
  epost: "Det finnes allerede en konto med denne e-posten.",
  ugyldig: "Noe gikk galt med databasen. Prøv igjen om litt.",
  sesjon: "Server-konfigurasjon mangler (SESSION_SECRET). Innlogging er midlertidig utilgjengelig.",
};

export default function Registrer({
  searchParams,
}: {
  searchParams: { feil?: string };
}) {
  return (
    <main className="wrap" style={noytralTema}>
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Bedriftsflyt</Link>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h1>Opprett konto</h1>
        <p className="muted" style={{ marginTop: 4 }}>14 dager gratis. Ingen bindingstid.</p>

        {searchParams.feil && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>
            {feilTekst[searchParams.feil] ?? feilTekst.ugyldig}
          </p>
        )}

        <form action={registrerMedEpost} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Bedriftsnavn</span>
            <input name="navn" required placeholder="F.eks. Silje Vipper" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Sted</span>
            <input name="sted" placeholder="F.eks. Hamar" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Ønsket nettadresse</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="muted" style={{ fontSize: 14, whiteSpace: "nowrap" }}>app.kundebox.no/</span>
              <input name="slug" placeholder="silje" style={inputStyle} />
            </div>
            <span className="muted" style={{ fontSize: 12 }}>La stå tom for å lage den fra navnet.</span>
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>E-post</span>
            <input name="epost" type="email" required placeholder="deg@epost.no" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Passord (minst 8 tegn)</span>
            <input name="passord" type="password" required minLength={8} style={inputStyle} />
          </label>
          <button className="btn" type="submit" style={{ marginTop: 4 }}>Opprett konto</button>
        </form>

        <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>
          Har du konto? <Link href="/dashboard/login">Logg inn</Link>
        </p>
      </div>
    </main>
  );
}
