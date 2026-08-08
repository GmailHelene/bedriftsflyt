import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import { hentSamtaler } from "@/lib/repository";
import { harDatabase } from "@/lib/db";

export const metadata = { title: "Samtaler · Bedriftsflyt" };

export default async function Samtaler() {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const dbPa = harDatabase();
  // Nyeste først fra basen -> snu til kronologisk (eldst øverst) for lesbarhet.
  const meldinger = dbPa ? (await hentSamtaler(slug, 150)).reverse() : [];

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

      <h1 style={{ marginTop: 24 }}>Samtaler</h1>
      <p className="muted" style={{ maxWidth: "56ch" }}>
        Det kundene har spurt KI-chatboten om. Bruk det til å se hva folk lurer på - og fyll gjerne inn svarene under
        «Vanlige spørsmål» på <Link href="/dashboard/oppsett">Innstillinger</Link>.
      </p>

      {!dbPa ? (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <p className="muted">Krever database.</p>
        </div>
      ) : meldinger.length === 0 ? (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <p className="muted">Ingen samtaler ennå. Så snart en kunde chatter med assistenten, dukker det opp her.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 16, marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {meldinger.map((m, i) => {
            const kunde = m.rolle === "user";
            return (
              <div
                key={i}
                style={{
                  maxWidth: "82%",
                  alignSelf: kunde ? "flex-start" : "flex-end",
                  background: kunde ? "var(--surface)" : "var(--accent)",
                  color: kunde ? "var(--ink)" : "#fff",
                  border: kunde ? "1px solid var(--line)" : "none",
                  borderRadius: 14,
                  padding: "10px 13px",
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>
                  {kunde ? "Kunde" : "Assistent"} · {m.naar}
                </div>
                {m.tekst}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
