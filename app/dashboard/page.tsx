import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import { hentBedrift, hentBookinger, hentFakturaer, hentSkattAvsatt, hentAbonnement } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import { lagreProfil, nyTjeneste, fjernTjeneste, nyFaktura, markerBetaltTest, kjorTrekk } from "./actions";

export const metadata = { title: "Dashbord · Bedriftsflyt" };

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14.5,
  fontFamily: "inherit",
  width: "100%",
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { abonnement?: string };
}) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const b = await hentBedrift(slug);
  if (!b) redirect("/dashboard/login");

  const dbPa = harDatabase();
  const bookinger = await hentBookinger(slug);
  const fakturaer = await hentFakturaer(slug);
  const skattAvsatt = await hentSkattAvsatt(slug);
  const abonnement = await hentAbonnement(slug);
  const erDev = process.env.NODE_ENV !== "production";

  return (
    <main className="wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          Bedriftsflyt
        </div>
        <Link href="/dashboard/logout" className="muted" style={{ marginLeft: "auto", fontSize: 14 }}>
          Logg ut
        </Link>
      </div>

      <h1 style={{ marginTop: 24 }}>Hei, {b.navn} 👋</h1>
      <p className="muted">Din arbeidsflate.</p>

      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {[
          ["/dashboard/kalender", "Kalender"],
          ["/dashboard/kunder", "Kunder"],
          ["/dashboard/komponer", "KI-tekst"],
          ["/dashboard/oppsett", "KI-chatbot"],
        ].map(([href, tekst]) => (
          <Link
            key={href}
            href={href}
            className="btn-ghost"
            style={{
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {tekst}
          </Link>
        ))}
      </nav>

      {!dbPa && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <b>Redigering krever database.</b>
          <p className="muted" style={{ marginTop: 4 }}>
            Sett <code>DATABASE_URL</code> i <code>.env.local</code> og kjør <code>npm run db:setup</code>.
            Uten den vises kun eksempeldata, og endringer lagres ikke.
          </p>
        </div>
      )}

      {/* Profil */}
      <form action={lagreProfil} className="card" style={{ padding: 20, marginTop: 20, display: "block" }}>
        <h2>Profil</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Navn</span>
            <input name="navn" defaultValue={b.navn} required style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Kort beskrivelse</span>
            <input name="tagline" defaultValue={b.tagline} style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={{ fontSize: 13 }}>Sted</span>
            <input name="sted" defaultValue={b.sted} style={inputStyle} />
          </label>
        </div>
        <button className="btn" type="submit" style={{ marginTop: 14, width: "auto", padding: "12px 20px" }} disabled={!dbPa}>
          Lagre profil
        </button>
        <Link href={`/${b.slug}`} className="muted" style={{ marginLeft: 14, fontSize: 14 }}>
          Se offentlig profil →
        </Link>
      </form>

      {/* Tjenester */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2>Tjenester ({b.tjenester.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {b.tjenester.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                border: "1px solid var(--line)",
                borderRadius: 10,
              }}
            >
              <span style={{ flex: 1 }}>
                {t.navn} <span className="muted">· {t.varighetMin} min</span>
              </span>
              <b>{t.prisKr.toLocaleString("nb-NO")} kr</b>
              <form action={fjernTjeneste}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="btn-ghost"
                  style={{ border: "none", background: "none", color: "var(--muted)", cursor: "pointer", padding: 4 }}
                  aria-label={`Slett ${t.navn}`}
                  disabled={!dbPa}
                >
                  Slett
                </button>
              </form>
            </div>
          ))}
        </div>

        <form
          action={nyTjeneste}
          style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "end" }}
        >
          <label style={{ flex: "2 1 160px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Ny tjeneste</span>
            <input name="navn" placeholder="F.eks. Påfyll vipper" required style={inputStyle} />
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Pris (kr)</span>
            <input name="pris" type="number" min={0} placeholder="650" required style={inputStyle} />
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Min</span>
            <input name="varighet" type="number" min={5} placeholder="60" required style={inputStyle} />
          </label>
          <button className="btn" type="submit" style={{ width: "auto", padding: "11px 18px" }} disabled={!dbPa}>
            Legg til
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2>Kommende bookinger ({bookinger.length})</h2>
        {bookinger.length === 0 ? (
          <p className="muted" style={{ marginTop: 6 }}>
            {dbPa ? "Ingen kommende bookinger ennå." : "Krever database for å vise ekte bookinger."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {bookinger.map((bk) => (
              <div
                key={bk.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                }}
              >
                <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color: "var(--accent-ink)" }}>
                  {bk.naar}
                </span>
                <span style={{ flex: 1 }}>
                  {bk.tjeneste}
                  <br />
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    {bk.kundeNavn ?? "Kunde"}
                    {bk.kundeTelefon ? ` · ${bk.kundeTelefon}` : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Faktura + skatt */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h2>Faktura</h2>
          <span className="muted" style={{ marginLeft: "auto", fontSize: 13 }}>
            Avsatt til skatt: <b style={{ color: "var(--ink)" }}>{skattAvsatt.toLocaleString("nb-NO")} kr</b>
          </span>
        </div>

        <form action={nyFaktura} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ flex: "2 1 160px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Ny faktura</span>
            <input name="beskrivelse" placeholder="F.eks. Påfyll vipper – Ida" required style={inputStyle} />
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Beløp (kr)</span>
            <input name="belop" type="number" min={1} placeholder="650" required style={inputStyle} />
          </label>
          <button className="btn" type="submit" style={{ width: "auto", padding: "11px 18px" }} disabled={!dbPa}>
            Opprett
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {fakturaer.length === 0 && (
            <p className="muted">{dbPa ? "Ingen fakturaer ennå." : "Krever database."}</p>
          )}
          {fakturaer.map((f) => {
            const betalt = f.status === "betalt";
            return (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  padding: "10px 12px",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                }}
              >
                <span style={{ flex: 1, minWidth: 120 }}>
                  {f.beskrivelse}
                  <br />
                  <span className="muted" style={{ fontSize: 12 }}>{f.naar}</span>
                </span>
                <b style={{ fontVariantNumeric: "tabular-nums" }}>{f.sumKr.toLocaleString("nb-NO")} kr</b>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 20,
                    background: betalt ? "var(--good-soft)" : "var(--raised)",
                    color: betalt ? "var(--good)" : "var(--muted)",
                  }}
                >
                  {betalt ? `Betalt · skatt ${f.skattAvsattKr.toLocaleString("nb-NO")} kr` : "Ubetalt"}
                </span>
                {!betalt && (
                  <>
                    <a
                      href={`/api/vipps/faktura?ref=${encodeURIComponent(f.reference)}`}
                      className="btn"
                      style={{ width: "auto", padding: "8px 12px", fontSize: 13, textDecoration: "none" }}
                    >
                      Betal med Vipps
                    </a>
                    {erDev && (
                      <form action={markerBetaltTest}>
                        <input type="hidden" name="reference" value={f.reference} />
                        <button
                          type="submit"
                          className="btn-ghost"
                          style={{ border: "1px solid var(--line)", background: "none", color: "var(--muted)", cursor: "pointer", padding: "8px 10px", borderRadius: 9, fontSize: 12 }}
                          title="Dev/test: simulerer betaling og skatt-avsetning uten Vipps"
                        >
                          Marker betalt (test)
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          «Betal med Vipps» krever Vipps-nøkler. «Marker betalt (test)» viser skatt-avsetningen (35 %) uten Vipps.
        </p>
      </div>
      {/* Abonnement (Vipps Recurring) */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2>Abonnement</h2>
        <p className="muted">Bedriftsflyt · 389 kr/mnd</p>
        <p style={{ marginTop: 6 }}>
          Status: <b>{abonnement.status ?? "ikke startet"}</b>
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          {abonnement.status === "ACTIVE" ? (
            erDev ? (
              <form action={kjorTrekk}>
                <button type="submit" className="btn" style={{ width: "auto", padding: "10px 16px" }}>
                  Trekk 389 nå (test)
                </button>
              </form>
            ) : (
              <span className="muted">Abonnement aktivt ✓</span>
            )
          ) : (
            <a
              href="/api/vipps/abonnement/start"
              className="btn"
              style={{ width: "auto", padding: "10px 16px", textDecoration: "none" }}
            >
              Start abonnement med Vipps
            </a>
          )}
          {abonnement.agreementId && (
            <a href="/api/vipps/abonnement/status" className="muted" style={{ fontSize: 14 }}>
              Oppdater status
            </a>
          )}
        </div>
        {searchParams.abonnement === "mangler" && (
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Vipps er ikke konfigurert ennå (mangler nøkler).
          </p>
        )}
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          Krever Vipps Recurring aktivert i portalen. Månedstrekket kjøres normalt av en planlagt jobb.
        </p>
      </div>
    </main>
  );
}
