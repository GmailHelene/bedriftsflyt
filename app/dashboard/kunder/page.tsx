import { redirect } from "next/navigation";
import { getSessionSlug } from "@/lib/auth";
import DashboardNav from "../DashboardNav";
import { hentKunder } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import { lagreKundeNotat } from "../actions";

export const metadata = { title: "Kunder · Bedriftsflyt" };

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14,
  fontFamily: "inherit",
  width: "100%",
};

export default async function Kunder() {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const dbPa = harDatabase();
  const kunder = dbPa ? await hentKunder(slug) : [];

  return (
    <main className="wrap">
      <DashboardNav />

      <h1 style={{ marginTop: 24 }}>Kunder</h1>
      <p className="muted">Alle som har booket hos deg — med historikk og dine egne notater.</p>

      {!dbPa && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <b>Krever database.</b>
          <p className="muted" style={{ marginTop: 4 }}>
            Sett <code>DATABASE_URL</code> for å se ekte kunder.
          </p>
        </div>
      )}

      {dbPa && kunder.length === 0 && (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <p className="muted">Ingen kunder ennå. Så snart noen booker, dukker de opp her.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {kunder.map((k, i) => (
          <details key={`${k.navn}-${k.telefon ?? ""}-${i}`} className="card" style={{ padding: 0 }}>
            <summary
              style={{
                listStyle: "none",
                cursor: "pointer",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "var(--accent-soft)",
                  color: "var(--accent-ink)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "Georgia, serif",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {k.navn.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{k.navn}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {k.telefon ? k.telefon : "uten telefon"}
                  {k.siste ? ` · sist ${k.siste}` : ""}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "var(--raised)",
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {k.antall} {k.antall === 1 ? "besøk" : "besøk"}
              </span>
            </summary>

            <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--line)" }}>
              {k.epost && (
                <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                  E-post: {k.epost}
                </p>
              )}

              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, margin: "14px 0 8px" }}>Historikk</h3>
              {k.bookinger.length === 0 ? (
                <p className="muted" style={{ fontSize: 13.5 }}>Ingen bookinger registrert.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {k.bookinger.map((bk, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: 13.5,
                        padding: "8px 10px",
                        border: "1px solid var(--line)",
                        borderRadius: 9,
                      }}
                    >
                      <span style={{ color: "var(--accent-ink)", fontWeight: 600, whiteSpace: "nowrap" }}>{bk.naar}</span>
                      <span style={{ flex: 1 }}>{bk.tjeneste ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}

              <form action={lagreKundeNotat} style={{ marginTop: 14 }}>
                <input type="hidden" name="navn" value={k.navn} />
                <input type="hidden" name="telefon" value={k.telefon ?? ""} />
                <label>
                  <span className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                    Notat (kun du ser dette)
                  </span>
                  <textarea
                    name="notat"
                    defaultValue={k.notat ?? ""}
                    rows={2}
                    placeholder="F.eks. allergisk mot lateks, liker kaffe uten melk …"
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                  />
                </label>
                <button className="btn" type="submit" style={{ marginTop: 10, width: "auto", padding: "9px 16px", fontSize: 14 }}>
                  Lagre notat
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
