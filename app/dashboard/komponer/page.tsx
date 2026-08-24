import { redirect } from "next/navigation";
import { getSessionSlug } from "@/lib/auth";
import DashboardNav from "../DashboardNav";
import { harKI } from "@/lib/compose";
import KomponerClient from "./KomponerClient";

export const metadata = { title: "KI-tekst · Bedriftsflyt" };

export default function Komponer() {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const kiPa = harKI();

  return (
    <main className="wrap">
      <DashboardNav />

      <h1 style={{ marginTop: 24 }}>KI-tekst</h1>
      <p className="muted" style={{ maxWidth: "56ch" }}>
        Få hjelp til å skrive innlegg, meldinger og svar, i din tone, med dine tjenester. Du redigerer alltid før du
        bruker teksten.
      </p>

      {!kiPa && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <b>KI ikke aktivert ennå.</b>
          <p className="muted" style={{ marginTop: 4 }}>
            Sett <code>ANTHROPIC_API_KEY</code> i miljøvariablene for å bruke tekstforslag.
          </p>
        </div>
      )}

      <KomponerClient />
    </main>
  );
}
