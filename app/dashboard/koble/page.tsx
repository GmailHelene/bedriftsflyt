import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { VIPPS_SUB_COOKIE } from "@/lib/auth";
import { kobleEier } from "../actions";

export const metadata = { title: "Koble bedrift · Bedriftsflyt" };

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

export default function Koble({ searchParams }: { searchParams: { feil?: string } }) {
  const sub = cookies().get(VIPPS_SUB_COOKIE)?.value;
  if (!sub) redirect("/dashboard/login");

  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        Bedriftsflyt
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h1>Koble bedriften din</h1>
        <p className="muted">
          Du er logget inn med Vipps ✓. Skriv inn slug-en til bedriften du skal styre, så knyttes den til Vipps-brukeren din.
        </p>
        {searchParams.feil && (
          <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 10 }}>
            Fant ingen ledig bedrift med den slug-en (kanskje allerede koblet til noen andre).
          </p>
        )}
        <form action={kobleEier} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          <input name="slug" placeholder="Bedrift-slug (f.eks. silje)" required style={inputStyle} aria-label="Bedrift-slug" />
          <button className="btn" type="submit">Koble bedrift</button>
        </form>
      </div>
    </main>
  );
}
