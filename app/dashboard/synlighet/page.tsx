import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import DashboardNav from "../DashboardNav";
import { hentBedrift } from "@/lib/repository";
import { harDatabase } from "@/lib/db";
import { lagreAnmeldelse } from "../actions";

export const metadata = { title: "Din side · Bedriftsflyt" };

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

const h2: React.CSSProperties = { marginBottom: 4 };

export default async function Synlighet({
  searchParams,
}: {
  searchParams: { lagret?: string };
}) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const b = await hentBedrift(slug);
  if (!b) redirect("/dashboard/login");

  const dbPa = harDatabase();
  const profilLenke = `app.kundebox.no/${b.slug}`;

  return (
    <main className="wrap">
      <DashboardNav />

      <h1 style={{ marginTop: 24 }}>Din side</h1>
      <p className="muted" style={{ maxWidth: "56ch" }}>
        Bli lettere å finne for kundene dine. Google-profil og anmeldelser er det som betyr mest lokalt.
      </p>

      {/* Din offentlige side */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h2 style={h2}>Din offentlige side</h2>
        <p className="muted" style={{ fontSize: 14 }}>Lenka du deler overalt - Google, Instagram-bio, Facebook, visittkort:</p>
        <p style={{ fontWeight: 700, color: "var(--accent-ink)", marginTop: 8, wordBreak: "break-all" }}>{profilLenke}</p>
        <Link href={`/${b.slug}`} className="muted" style={{ fontSize: 14 }}>
          Se siden →
        </Link>
      </div>

      {/* Google-bedriftsprofil */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2 style={h2}>Google-bedriftsprofil (gratis)</h2>
        <p className="muted" style={{ fontSize: 14 }}>
          Dette gjør at du dukker opp i Google-søk og på kartet. Ta det steg for steg:
        </p>
        <ol style={{ margin: "12px 0 0", paddingLeft: 20, lineHeight: 1.7, fontSize: 14.5 }}>
          <li>Gå til <b>google.com/business</b> og logg inn med en Google-konto.</li>
          <li>Søk opp bedriftsnavnet ditt. Finnes det allerede, krev eierskap. Ellers velg «Legg til bedriften din».</li>
          <li>
            Fyll inn: navn (<b>{b.navn}</b>), kategori (velg det som passer bransjen), område (<b>{b.sted || "stedet ditt"}</b>),
            telefon, og nettside - lim inn <b>{profilLenke}</b>.
          </li>
          <li>Verifiser (Google sender en kode på SMS, telefon eller post).</li>
          <li>Legg til bilder, åpningstider og en kort beskrivelse.</li>
        </ol>
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          Trenger du en beskrivelse? Lag den på <Link href="/dashboard/komponer">KI-tekst</Link> (velg «Google-beskrivelse»).
        </p>
      </div>

      {/* Anmeldelser */}
      <form action={lagreAnmeldelse} className="card" style={{ padding: 20, marginTop: 16, display: "block" }}>
        <h2 style={h2}>Be om anmeldelser</h2>
        <p className="muted" style={{ fontSize: 14, maxWidth: "58ch" }}>
          Jevne Google-anmeldelser er det som løfter deg i lokale søk. Lim inn Google-anmeldelseslenka di her. Da dukker
          «Gi en vurdering» opp på siden din og i bekreftelses-eposten kundene får.
        </p>
        {searchParams.lagret === "1" && (
          <div style={{ margin: "12px 0", padding: 10, borderRadius: 10, background: "var(--good-soft)", color: "var(--good)", fontWeight: 700, fontSize: 14 }}>
            Lagret ✓
          </div>
        )}
        <label style={{ display: "block", marginTop: 12 }}>
          <span className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Google-anmeldelseslenke</span>
          <input name="url" type="url" defaultValue={b.anmeldelseUrl ?? ""} placeholder="https://g.page/r/…" style={inputStyle} />
        </label>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
          Finn lenka i Google-bedriftsprofilen din under «Be om anmeldelser» → «Del anmeldelsesskjema».
        </p>
        <button className="btn" type="submit" style={{ marginTop: 14, width: "auto", padding: "12px 20px" }} disabled={!dbPa}>
          Lagre lenke
        </button>
      </form>

      {/* SEO-grep */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2 style={h2}>Enkle grep som hjelper</h2>
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.7, fontSize: 14.5 }}>
          <li>Fyll ut beskrivelse og alle tjenester med priser - både Google og KI-en leser dem.</li>
          <li>Bruk stedsnavnet ditt i teksten (f.eks. «{b.sted || "stedet ditt"}»).</li>
          <li>Få jevnt med anmeldelser, ikke ti på én dag og så stille.</li>
          <li>Del profillenka der kundene allerede er - ikke vent på at de finner deg.</li>
        </ul>
      </div>
    </main>
  );
}
