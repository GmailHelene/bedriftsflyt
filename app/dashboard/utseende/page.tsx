import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import { hentBedrift } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import DashboardNav from "../DashboardNav";
import BildeOpplaster from "./BildeOpplaster";
import { lastOppProfilbilde, fjernProfilbilde, leggTilGalleri, fjernGalleri, lagreMerkefarge } from "../actions";

export const metadata = { title: "Utseende · Bedriftsflyt" };

const FARGER = ["#c0466e", "#1f5f8b", "#3b7d5a", "#8a5cc0", "#c56a1f", "#2f3b52", "#b03a4a", "#0f766e"];

export default async function Utseende({ searchParams }: { searchParams: { lagret?: string } }) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const b = await hentBedrift(slug);
  if (!b) redirect("/dashboard/login");

  const dbPa = harDatabase();
  const galleri = b.galleri ?? [];
  const valgtFarge = b.merkefarge ?? "#c0466e";

  return (
    <main className="wrap">
      <DashboardNav />

      <h1 style={{ marginTop: 24 }}>Utseende</h1>
      <p className="muted" style={{ maxWidth: "56ch" }}>
        Gjør profilen din til din egen. Bilder og farge vises på den offentlige siden kundene ser.
      </p>

      {searchParams.lagret && (
        <div className="card" style={{ padding: 12, marginTop: 16, borderColor: "var(--good)", background: "var(--good-soft)" }}>
          <b style={{ color: "var(--good)" }}>Lagret ✓</b>
        </div>
      )}

      {!dbPa && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <b>Lagring krever database.</b>
        </div>
      )}

      {/* Profilbilde */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h2>Profilbilde</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>Logo eller et bilde av deg. Vises øverst på profilen.</p>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginTop: 12, flexWrap: "wrap" }}>
          {b.profilbilde ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <img
                src={b.profilbilde}
                alt="Nåværende profilbilde"
                style={{ width: 96, height: 96, borderRadius: 18, objectFit: "cover", border: "1px solid var(--line)" }}
              />
              <form action={fjernProfilbilde}>
                <button type="submit" className="muted" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "var(--muted)" }}>
                  Fjern
                </button>
              </form>
            </div>
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: 18, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "Georgia, serif", fontSize: 34 }}>
              {b.navn.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <BildeOpplaster action={lastOppProfilbilde} knappTekst="Last opp profilbilde" maxDim={600} />
          </div>
        </div>
      </div>

      {/* Galleri */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2>Galleri ({galleri.length}/8)</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Vis fram arbeidet ditt. Kundene bestiller ofte ut fra bilder.
        </p>
        {galleri.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginTop: 14 }}>
            {galleri.map((bilde, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={bilde} alt={`Galleribilde ${i + 1}`} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12, border: "1px solid var(--line)" }} />
                <form action={fjernGalleri} style={{ position: "absolute", top: 6, right: 6 }}>
                  <input type="hidden" name="indeks" value={i} />
                  <button
                    type="submit"
                    aria-label="Fjern bilde"
                    style={{ border: "none", background: "rgba(0,0,0,.6)", color: "#fff", width: 26, height: 26, borderRadius: 999, cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
        {galleri.length < 8 && (
          <div style={{ marginTop: 14 }}>
            <BildeOpplaster action={leggTilGalleri} knappTekst="Legg til bilde" maxDim={1000} />
          </div>
        )}
      </div>

      {/* Merkefarge */}
      <form action={lagreMerkefarge} className="card" style={{ padding: 20, marginTop: 16, display: "block" }}>
        <h2>Merkefarge</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>Fargen på knapper og detaljer på profilen din.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
          {FARGER.map((f) => (
            <label key={f} style={{ cursor: "pointer" }} title={f}>
              <input type="radio" name="merkefarge" value={f} defaultChecked={valgtFarge.toLowerCase() === f.toLowerCase()} style={{ position: "absolute", opacity: 0 }} />
              <span
                style={{
                  display: "inline-block",
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: f,
                  border: valgtFarge.toLowerCase() === f.toLowerCase() ? "3px solid var(--ink)" : "3px solid transparent",
                  boxShadow: "0 0 0 1px var(--line)",
                }}
              />
            </label>
          ))}
        </div>
        <button className="btn" type="submit" style={{ marginTop: 16, width: "auto", padding: "12px 20px" }} disabled={!dbPa}>
          Lagre farge
        </button>
      </form>

      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
        <Link href={`/${b.slug}`}>Se profilen din →</Link>
      </p>
    </main>
  );
}
