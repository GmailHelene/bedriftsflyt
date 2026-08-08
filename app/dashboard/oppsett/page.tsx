import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import { hentBedrift, hentChatbotConfig } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import { harKI } from "@/lib/chat";
import { lagreOppsett, lagreApningstider, lagreDepositum } from "../actions";

export const metadata = { title: "Innstillinger · Bedriftsflyt" };

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

const labelHint: React.CSSProperties = { fontSize: 13, display: "block", marginBottom: 4 };

// Postgres dow: man=1 .. lør=6, søn=0. Vises i naturlig rekkefølge.
const DAGER: { dow: number; navn: string }[] = [
  { dow: 1, navn: "Man" },
  { dow: 2, navn: "Tir" },
  { dow: 3, navn: "Ons" },
  { dow: 4, navn: "Tor" },
  { dow: 5, navn: "Fre" },
  { dow: 6, navn: "Lør" },
  { dow: 0, navn: "Søn" },
];

export default async function Oppsett({
  searchParams,
}: {
  searchParams: { lagret?: string };
}) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const b = await hentBedrift(slug);
  if (!b) redirect("/dashboard/login");

  const dbPa = harDatabase();
  const c = await hentChatbotConfig(slug);
  const kiPa = harKI();
  const apen = b.apningstider;

  return (
    <main className="wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          Bedriftsflyt
        </div>
        <Link href="/dashboard" className="muted" style={{ marginLeft: "auto", fontSize: 14 }}>
          ← Dashbord
        </Link>
      </div>

      <h1 style={{ marginTop: 24 }}>Innstillinger</h1>
      <p className="muted" style={{ maxWidth: "56ch" }}>
        Åpningstider, KI-chatbot og booking. Åpningstidene styrer både hva chatboten svarer og hvilke tider kundene
        kan booke, så det aldri spriker.
      </p>

      {searchParams.lagret && (
        <div className="card" style={{ padding: 12, marginTop: 16, borderColor: "var(--good)", background: "var(--good-soft)" }}>
          <b style={{ color: "var(--good)" }}>Lagret ✓</b>
        </div>
      )}

      {!dbPa && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <b>Lagring krever database.</b>
          <p className="muted" style={{ marginTop: 4 }}>
            Uten <code>DATABASE_URL</code> lagres ikke endringene.
          </p>
        </div>
      )}

      {/* Åpningstider */}
      <form action={lagreApningstider} className="card" style={{ padding: 20, marginTop: 20, display: "block" }}>
        <h2>Åpningstider</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Kundene kan booke innenfor disse tidene. Chatboten svarer det samme.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 120px" }}>
            <span className="muted" style={labelHint}>Åpner</span>
            <input name="fra" type="time" defaultValue={apen.fra} style={inputStyle} />
          </label>
          <label style={{ flex: "1 1 120px" }}>
            <span className="muted" style={labelHint}>Stenger</span>
            <input name="til" type="time" defaultValue={apen.til} style={inputStyle} />
          </label>
        </div>
        <div style={{ marginTop: 14 }}>
          <span className="muted" style={labelHint}>Åpne dager</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DAGER.map((d) => (
              <label
                key={d.dow}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  padding: "7px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" name="dager" value={d.dow} defaultChecked={apen.dager.includes(d.dow)} />
                {d.navn}
              </label>
            ))}
          </div>
        </div>
        <button className="btn" type="submit" style={{ marginTop: 16, width: "auto", padding: "12px 20px" }} disabled={!dbPa}>
          Lagre åpningstider
        </button>
      </form>

      {/* KI-chatbot */}
      <form action={lagreOppsett} className="card" style={{ padding: 20, marginTop: 16, display: "block" }}>
        <h2>KI-chatbot</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Assistenten svarer kundene på nettsiden. Den bruker tjenestene, prisene og åpningstidene dine automatisk.
        </p>
        {!kiPa && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            (KI aktiveres når <code>ANTHROPIC_API_KEY</code> er satt. Du kan fylle inn feltene nå.)
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
          <label>
            <span className="muted" style={labelHint}>Adresse / hvor kunden møter</span>
            <input name="adresse" defaultValue={c.adressePolicy ?? ""} placeholder="Sendes på SMS dagen før timen" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={labelHint}>Avbestillingsregler</span>
            <input name="avbestilling" defaultValue={c.avbestilling ?? ""} placeholder="Gratis frem til 24 timer før timen" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={labelHint}>Tone</span>
            <input name="tone" defaultValue={c.tone ?? ""} placeholder="Vennlig og uformell" style={inputStyle} />
          </label>
          <label>
            <span className="muted" style={labelHint}>
              Vanlige spørsmål og svar (ett per linje)
            </span>
            <textarea
              name="faq"
              defaultValue={c.faq ?? ""}
              rows={5}
              placeholder={"Tar dere kort? Ja, Vipps og kort.\nHar dere parkering? Gateparkering rett utenfor."}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </label>
        </div>
        <button className="btn" type="submit" style={{ marginTop: 16, width: "auto", padding: "12px 20px" }} disabled={!dbPa}>
          Lagre chatbot
        </button>
      </form>

      {/* Depositum */}
      <form action={lagreDepositum} className="card" style={{ padding: 20, marginTop: 16, display: "block" }}>
        <h2>Depositum ved booking</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 2, maxWidth: "56ch" }}>
          Krev et lite forskudd for å redusere no-shows. Vises til kunden ved booking. Selve trekket via Vipps
          aktiveres når Vipps-nøklene er på plass. Sett 0 for å slå av.
        </p>
        <label style={{ display: "block", marginTop: 12, maxWidth: 200 }}>
          <span className="muted" style={labelHint}>Depositum (kr)</span>
          <input name="depositum" type="number" min={0} step={50} defaultValue={b.depositumKr ?? 0} style={inputStyle} />
        </label>
        <button className="btn" type="submit" style={{ marginTop: 16, width: "auto", padding: "12px 20px" }} disabled={!dbPa}>
          Lagre depositum
        </button>
      </form>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14, maxWidth: "56ch" }}>
        For Google-profil og anmeldelser, se{" "}
        <Link href="/dashboard/synlighet">Synlighet</Link>.
      </p>
    </main>
  );
}
