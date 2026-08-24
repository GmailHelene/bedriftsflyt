import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import { hentBedrift, hentBookinger, hentFakturaer, hentSkattAvsatt, hentAbonnement, hentProveperiode } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import { lagreProfil, nyTjeneste, fjernTjeneste, nyFaktura, markerBetaltTest, kansellerBookingDash } from "./actions";
import DashboardNav from "./DashboardNav";

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

  const dbPa = harDatabase();
  let b: Awaited<ReturnType<typeof hentBedrift>> = null;
  let bookinger: Awaited<ReturnType<typeof hentBookinger>> = [];
  let fakturaer: Awaited<ReturnType<typeof hentFakturaer>> = [];
  let skattAvsatt = 0;
  let abonnement: Awaited<ReturnType<typeof hentAbonnement>> = { agreementId: null, status: null };
  let prove: Awaited<ReturnType<typeof hentProveperiode>> = { dagerIgjen: 14, utlopt: false, status: null };
  let dbFeil = false;
  let feilMelding = "";
  try {
    b = await hentBedrift(slug);
    if (b) {
      bookinger = await hentBookinger(slug);
      fakturaer = await hentFakturaer(slug);
      skattAvsatt = await hentSkattAvsatt(slug);
      abonnement = await hentAbonnement(slug);
      prove = await hentProveperiode(slug);
    }
  } catch (e) {
    console.error("[dashboard] datahenting feilet:", e instanceof Error ? e.message : e);
    dbFeil = true;
    feilMelding = e instanceof Error ? e.message : String(e);
  }

  if (dbFeil) {
    return (
      <main className="wrap">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          Bedriftsflyt
        </div>
        <div className="card" style={{ padding: 20, marginTop: 24 }}>
          <h1>Midlertidig utilgjengelig</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Vi klarte ikke å hente dataene dine akkurat nå. Prøv igjen om litt.
          </p>
          {feilMelding && (
            <p style={{ marginTop: 12, fontSize: 12, fontFamily: "monospace", color: "var(--accent-ink)", wordBreak: "break-word" }}>
              Teknisk: {feilMelding}
            </p>
          )}
        </div>
      </main>
    );
  }
  if (!b) redirect("/dashboard/login");

  // Test-snarveien «Marker betalt» vises kun utenfor produksjon (eller når den er eksplisitt
  // slått på i et testmiljø). Selve server-handlingen markerBetaltTest vokter det samme.
  const erDev = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_BETALT === "1";
  const aktivtAbo = ["trialing", "active", "past_due"].includes(abonnement.status ?? "");
  const aboStatusVis =
    ({ trialing: "prøveperiode (gratis)", active: "aktivt", past_due: "betaling mangler", canceled: "sagt opp" } as Record<
      string,
      string
    >)[abonnement.status ?? ""] ?? (abonnement.status ?? "ikke startet");

  return (
    <main className="wrap">
      <DashboardNav />

      <h1 style={{ marginTop: 24 }}>Hei, {b.navn}</h1>
      <p className="muted">Din arbeidsflate.</p>

      {!aktivtAbo && (
        <div
          className="card"
          style={{
            padding: "10px 14px",
            marginTop: 14,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            borderColor: prove.utlopt ? "var(--accent)" : "var(--line)",
            background: prove.utlopt ? "var(--accent-soft)" : "var(--surface)",
          }}
        >
          <span style={{ fontSize: 13.5 }}>
            {prove.utlopt
              ? "Den gratis prøveperioden er over."
              : `Gratis prøveperiode: ${prove.dagerIgjen} ${prove.dagerIgjen === 1 ? "dag" : "dager"} igjen, ingen kort kreves.`}
          </span>
          <a href="/api/stripe/checkout" style={{ fontSize: 13.5, marginLeft: "auto", fontWeight: 600 }}>
            Start abonnement →
          </a>
        </div>
      )}

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
                <form action={kansellerBookingDash}>
                  <input type="hidden" name="id" value={bk.id} />
                  <button
                    type="submit"
                    style={{
                      border: "1px solid var(--line)",
                      background: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: "6px 11px",
                      borderRadius: 9,
                      fontSize: 12.5,
                    }}
                    aria-label={`Avlys ${bk.tjeneste}`}
                  >
                    Avlys
                  </button>
                </form>
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
          <label style={{ flex: "2 1 150px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Beskrivelse</span>
            <input name="beskrivelse" placeholder="F.eks. Påfyll vipper" required style={inputStyle} />
          </label>
          <label style={{ flex: "1 1 120px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Kunde</span>
            <input name="kjoper" placeholder="Ida Hansen" style={inputStyle} />
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <span className="muted" style={{ fontSize: 13 }}>Beløp{b.mvaRegistrert ? " eks. mva" : ""} (kr)</span>
            <input name="belop" type="number" min={1} placeholder="650" required style={inputStyle} />
          </label>
          <button className="btn" type="submit" style={{ width: "auto", padding: "11px 18px" }} disabled={!dbPa}>
            Opprett
          </button>
        </form>
        {!b.orgNr && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Tips: fyll inn org.nr og betalingsinfo under <Link href="/dashboard/oppsett">Innstillinger</Link> for gyldige fakturaer.
          </p>
        )}

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
                  {f.fakturaNr ? `#${f.fakturaNr} · ` : ""}
                  {f.beskrivelse}
                  <br />
                  <span className="muted" style={{ fontSize: 12 }}>
                    {f.kjoper ? `${f.kjoper} · ` : ""}
                    {f.naar}
                  </span>
                </span>
                <b style={{ fontVariantNumeric: "tabular-nums" }}>{f.sumKr.toLocaleString("nb-NO")} kr</b>
                <Link href={`/dashboard/faktura/${f.id}`} className="muted" style={{ fontSize: 13 }}>
                  Vis / PDF
                </Link>
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
      {/* Abonnement (Stripe) */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2>Abonnement</h2>
        {aktivtAbo ? (
          <>
            <p className="muted">Bedriftsflyt · 389 kr/mnd · ingen bindingstid</p>
            <p style={{ marginTop: 6 }}>
              Status: <b>{aboStatusVis}</b>
            </p>
            <a
              href="/api/stripe/portal"
              className="btn"
              style={{ width: "auto", padding: "10px 16px", textDecoration: "none", marginTop: 12, display: "inline-flex" }}
            >
              Administrer abonnement
            </a>
          </>
        ) : prove.utlopt ? (
          <>
            <p style={{ marginTop: 4 }}>Den gratis prøveperioden er over.</p>
            <p className="muted" style={{ marginTop: 4 }}>Start abonnement (389 kr/mnd) for å fortsette. Ingen bindingstid.</p>
            <a
              href="/api/stripe/checkout"
              className="btn"
              style={{ width: "auto", padding: "10px 16px", textDecoration: "none", marginTop: 12, display: "inline-flex" }}
            >
              Start abonnement
            </a>
          </>
        ) : (
          <>
            <p style={{ marginTop: 4 }}>
              <b style={{ color: "var(--good)" }}>Gratis prøveperiode</b> - {prove.dagerIgjen} {prove.dagerIgjen === 1 ? "dag" : "dager"} igjen.
            </p>
            <p className="muted" style={{ marginTop: 4, maxWidth: "56ch" }}>
              Ingen kort kreves. Du kan bruke alt fritt. Vil du fortsette etter prøveperioden, starter du abonnementet når du er klar.
            </p>
            <a
              href="/api/stripe/checkout"
              className="btn"
              style={{ width: "auto", padding: "10px 16px", textDecoration: "none", marginTop: 12, display: "inline-flex" }}
            >
              Start abonnement (389 kr/mnd)
            </a>
          </>
        )}
        {searchParams.abonnement === "ok" && (
          <p style={{ color: "var(--good)", fontWeight: 600, fontSize: 13, marginTop: 10 }}>Takk! Abonnementet er i gang.</p>
        )}
        {searchParams.abonnement === "avbrutt" && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>Du avbrøt. Ingenting er trukket.</p>
        )}
        {searchParams.abonnement === "mangler" && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>Stripe er ikke konfigurert ennå (mangler nøkler).</p>
        )}
        {(searchParams.abonnement === "feil" || searchParams.abonnement === "ingen") && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>Noe gikk galt. Prøv igjen.</p>
        )}
      </div>
    </main>
  );
}
