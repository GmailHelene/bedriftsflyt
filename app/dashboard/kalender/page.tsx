import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import DashboardNav from "../DashboardNav";
import { hentUke } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import { leggTilDager, ukedagNavn, visDato, idagOslo } from "@/lib/dato";
import { kansellerBookingDash } from "../actions";

export const metadata = { title: "Kalender · Bedriftsflyt" };

export default async function Kalender({
  searchParams,
}: {
  searchParams: { uke?: string };
}) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const dbPa = harDatabase();
  const { mandag, bookinger } = await hentUke(slug, searchParams.uke);

  const dager = Array.from({ length: 7 }, (_, i) => leggTilDager(mandag, i));
  const forrige = leggTilDager(mandag, -7);
  const neste = leggTilDager(mandag, 7);
  const idag = idagOslo();

  const perDag = new Map<string, typeof bookinger>();
  for (const b of bookinger) {
    const liste = perDag.get(b.dato) ?? [];
    liste.push(b);
    perDag.set(b.dato, liste);
  }

  return (
    <main className="wrap">
      <DashboardNav />

      <h1 style={{ marginTop: 24 }}>Kalender</h1>
      <p className="muted">Bookinger uke for uke.</p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 18,
          justifyContent: "space-between",
        }}
      >
        <Link
          href={`/dashboard/kalender?uke=${forrige}`}
          className="btn-ghost"
          style={{ display: "inline-flex", padding: "8px 14px", borderRadius: 10, fontSize: 14, textDecoration: "none" }}
        >
          ← Forrige
        </Link>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600 }}>
          {visDato(mandag)}-{visDato(leggTilDager(mandag, 6))}
        </span>
        <Link
          href={`/dashboard/kalender?uke=${neste}`}
          className="btn-ghost"
          style={{ display: "inline-flex", padding: "8px 14px", borderRadius: 10, fontSize: 14, textDecoration: "none" }}
        >
          Neste →
        </Link>
      </div>

      {!dbPa && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <b>Krever database.</b>
          <p className="muted" style={{ marginTop: 4 }}>
            Sett <code>DATABASE_URL</code> for å se ekte bookinger.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        {dager.map((dato) => {
          const liste = perDag.get(dato) ?? [];
          const erIdag = dato === idag;
          return (
            <div
              key={dato}
              className="card"
              style={{ padding: 16, borderColor: erIdag ? "var(--accent)" : "var(--line)" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <h2 style={{ margin: 0, textTransform: "capitalize" }}>{ukedagNavn(dato)}</h2>
                <span className="muted" style={{ fontSize: 13 }}>{visDato(dato)}</span>
                {erIdag && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "var(--accent-ink)",
                      background: "var(--accent-soft)",
                      padding: "2px 9px",
                      borderRadius: 20,
                    }}
                  >
                    I dag
                  </span>
                )}
              </div>

              {liste.length === 0 ? (
                <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>Ingen bookinger.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {liste.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "9px 12px",
                        border: "1px solid var(--line)",
                        borderRadius: 9,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "var(--accent-ink)",
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.tid}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        {b.tjeneste ?? "-"}
                        <br />
                        <span className="muted" style={{ fontSize: 12.5 }}>{b.kunde ?? "Kunde"}</span>
                      </span>
                      <form action={kansellerBookingDash}>
                        <input type="hidden" name="id" value={b.id} />
                        <button
                          type="submit"
                          style={{
                            border: "1px solid var(--line)",
                            background: "none",
                            color: "var(--muted)",
                            cursor: "pointer",
                            padding: "5px 10px",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          aria-label="Avlys booking"
                        >
                          Avlys
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
