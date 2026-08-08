import Link from "next/link";
import { verifiserReset } from "@/lib/token";
import { settNyttPassord } from "../../actions";

export const metadata = { title: "Nytt passord · Bedriftsflyt" };

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

export default function Nullstill({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { feil?: string };
}) {
  const gyldig = verifiserReset(params.token) !== null;

  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Bedriftsflyt</Link>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h1>Velg nytt passord</h1>

        {!gyldig || searchParams.feil === "token" ? (
          <>
            <p className="muted" style={{ marginTop: 10 }}>
              Lenken er ugyldig eller utløpt (den varer i 1 time). Be om en ny.
            </p>
            <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
              <Link href="/dashboard/glemt">Send ny lenke</Link>
            </p>
          </>
        ) : (
          <>
            {searchParams.feil === "kort" && (
              <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>Passordet må være minst 8 tegn.</p>
            )}
            <form action={settNyttPassord} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <input type="hidden" name="token" value={params.token} />
              <input name="passord" type="password" required minLength={8} placeholder="Nytt passord (minst 8 tegn)" style={inputStyle} aria-label="Nytt passord" />
              <button className="btn" type="submit">Lagre nytt passord</button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
