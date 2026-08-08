import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import { hentBedrift, hentChatbotConfig } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import { harKI } from "@/lib/chat";
import { lagreOppsett } from "../actions";

export const metadata = { title: "KI-chatbot · Bedriftsflyt" };

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

      <h1 style={{ marginTop: 24 }}>KI-chatbot</h1>
      <p className="muted" style={{ maxWidth: "56ch" }}>
        Assistenten svarer kundene dine på nettsiden — om priser, ledige tider og det du fyller inn her. Den bruker
        alltid tjenestene og prisene dine automatisk. Feltene under gir den resten.
      </p>

      {searchParams.lagret === "1" && (
        <div
          className="card"
          style={{ padding: 12, marginTop: 16, borderColor: "var(--good)", background: "var(--good-soft)" }}
        >
          <b style={{ color: "var(--good)" }}>Lagret ✓</b>{" "}
          <span className="muted">Assistenten svarer med dette fra nå.</span>
        </div>
      )}

      {!kiPa && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <b>KI ikke aktivert ennå.</b>
          <p className="muted" style={{ marginTop: 4 }}>
            Sett <code>ANTHROPIC_API_KEY</code> i miljøvariablene for at chatboten skal svare. Du kan fylle inn
            feltene nå — de tas i bruk så snart nøkkelen er på plass.
          </p>
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

      <form action={lagreOppsett} className="card" style={{ padding: 20, marginTop: 20, display: "block" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label>
            <span className="muted" style={labelHint}>Åpningstider</span>
            <input
              name="apningstider"
              defaultValue={c.apningstider ?? ""}
              placeholder="mandag–lørdag 09–17, søndag stengt"
              style={inputStyle}
            />
          </label>

          <label>
            <span className="muted" style={labelHint}>Adresse / hvor kunden møter</span>
            <input
              name="adresse"
              defaultValue={c.adressePolicy ?? ""}
              placeholder="Sendes på SMS dagen før timen (hjemmestudio)"
              style={inputStyle}
            />
          </label>

          <label>
            <span className="muted" style={labelHint}>Avbestillingsregler</span>
            <input
              name="avbestilling"
              defaultValue={c.avbestilling ?? ""}
              placeholder="Gratis frem til 24 timer før timen"
              style={inputStyle}
            />
          </label>

          <label>
            <span className="muted" style={labelHint}>Tone</span>
            <input
              name="tone"
              defaultValue={c.tone ?? ""}
              placeholder="Vennlig og uformell"
              style={inputStyle}
            />
          </label>

          <label>
            <span className="muted" style={labelHint}>
              Vanlige spørsmål og svar (ett per linje — assistenten svarer naturlig, også om kunden spør annerledes)
            </span>
            <textarea
              name="faq"
              defaultValue={c.faq ?? ""}
              rows={6}
              placeholder={
                "Tar dere kort? Ja, Vipps og kort.\nHar dere parkering? Gateparkering rett utenfor.\nKan jeg ta med barn? Ja, det går fint."
              }
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </label>
        </div>

        <button
          className="btn"
          type="submit"
          style={{ marginTop: 18, width: "auto", padding: "12px 22px" }}
          disabled={!dbPa}
        >
          Lagre
        </button>
        <Link href={`/${b.slug}`} className="muted" style={{ marginLeft: 14, fontSize: 14 }}>
          Se profilen med chatboten →
        </Link>
      </form>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14, maxWidth: "56ch" }}>
        Assistenten finner aldri på svar den ikke vet. Er den usikker, ber den kunden ringe eller sende melding.
      </p>
    </main>
  );
}
