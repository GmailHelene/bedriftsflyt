import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { VIPPS_SUB_COOKIE } from "@/lib/auth";
import { registrerBedrift } from "../actions";

export const metadata = { title: "Opprett bedrift · Bedriftsflyt" };

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

export default function Onboarding({ searchParams }: { searchParams: { feil?: string } }) {
  const sub = cookies().get(VIPPS_SUB_COOKIE)?.value;
  if (!sub) redirect("/dashboard/login");

  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        Bedriftsflyt
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h1>Opprett bedriften din</h1>
        <p className="muted">Du er logget inn med Vipps ✓. Fyll inn det viktigste, så er du i gang, resten kan du endre senere.</p>

        {searchParams.feil === "slug" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>Den nettadressen er opptatt. Velg en annen.</p>
        )}
        {searchParams.feil === "felt" && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>Fyll inn navn og nettadresse.</p>
        )}

        <form action={registrerBedrift} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Bedriftsnavn</span>
            <input name="navn" placeholder="F.eks. Silje · Vipper & Bryn" required style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Sted</span>
            <input name="sted" placeholder="F.eks. Hamar" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Din nettadresse</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span className="muted" style={{ fontSize: 14, whiteSpace: "nowrap" }}>app.kundebox.no/</span>
              <input name="slug" placeholder="silje" required style={inputStyle} />
            </div>
          </label>

          <label>
            <span className="muted" style={{ fontSize: 13 }}>E-post (valgfritt)</span>
            <input name="epost" type="email" placeholder="deg@epost.no" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Passord (valgfritt, minst 8 tegn)</span>
            <input name="passord" type="password" minLength={8} style={inputStyle} />
          </label>
          <p className="muted" style={{ fontSize: 12 }}>
            Setter du e-post + passord, kan du logge inn begge veier senere - både med Vipps og med e-post + passord.
          </p>

          <button className="btn" type="submit" style={{ marginTop: 4 }}>
            Opprett og fortsett
          </button>
        </form>
      </div>
    </main>
  );
}
