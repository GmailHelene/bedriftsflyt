import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionSlug } from "@/lib/auth";
import { hentFakturaDetalj } from "@/lib/repository";
import PrintKnapp from "./PrintKnapp";

export const metadata = { title: "Faktura · Bedriftsflyt" };

function nb(n: number): string {
  return n.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Rad({ label, verdi }: { label: string; verdi: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
      <span className="muted">{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{verdi}</span>
    </div>
  );
}

export default async function FakturaSide({ params }: { params: { id: string } }) {
  const slug = getSessionSlug();
  if (!slug) redirect("/dashboard/login");

  const f = await hentFakturaDetalj(slug, params.id);
  if (!f) redirect("/dashboard");

  return (
    <main className="wrap" style={{ maxWidth: 720 }}>
      <div className="noprint" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Link href="/dashboard" className="muted" style={{ fontSize: 14 }}>
          ← Dashbord
        </Link>
        <div style={{ marginLeft: "auto" }}>
          <PrintKnapp />
        </div>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0 }}>Faktura</h1>
            {f.fakturaNr != null && <p className="muted" style={{ margin: "4px 0 0" }}>Fakturanr. {f.fakturaNr}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>{f.bedriftNavn}</div>
            {f.bedriftSted && <div className="muted" style={{ fontSize: 14 }}>{f.bedriftSted}</div>}
            {f.orgNr && (
              <div className="muted" style={{ fontSize: 14 }}>
                Org.nr {f.orgNr}
                {f.mvaRegistrert ? " MVA" : ""}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, marginTop: 24, flexWrap: "wrap" }}>
          <div>
            <div className="muted" style={{ fontSize: 12.5 }}>Faktura til</div>
            <div style={{ fontWeight: 600 }}>{f.kjoper ?? "-"}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12.5 }}>Fakturadato</div>
            <div>{f.dato}</div>
          </div>
          {f.forfall && (
            <div>
              <div className="muted" style={{ fontSize: 12.5 }}>Forfall</div>
              <div>{f.forfall}</div>
            </div>
          )}
        </div>

        <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th style={{ padding: "8px 0", textAlign: "left" }}>Beskrivelse</th>
              <th style={{ padding: "8px 0", textAlign: "right" }}>Beløp</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "10px 0" }}>{f.beskrivelse}</td>
              <td style={{ padding: "10px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{nb(f.nettoKr)} kr</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 12, marginLeft: "auto", maxWidth: 260 }}>
          {f.mvaKr > 0 && (
            <>
              <Rad label="Nettobeløp" verdi={`${nb(f.nettoKr)} kr`} />
              <Rad label="Mva (25 %)" verdi={`${nb(f.mvaKr)} kr`} />
            </>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderTop: "2px solid var(--ink)",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            <span>Å betale</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{nb(f.sumKr)} kr</span>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <div className="muted" style={{ fontSize: 12.5 }}>Betaling</div>
          <div style={{ fontSize: 14.5 }}>
            {f.betalingsinfo ?? "Oppgi betalingsinfo under Innstillinger → Fakturaopplysninger."}
          </div>
          {!f.mvaRegistrert && (
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Ikke mva-registrert. Mva er ikke beregnet.
            </div>
          )}
        </div>
      </div>

      <p className="muted noprint" style={{ fontSize: 12.5, marginTop: 12 }}>
        Tips: i utskrifts-dialogen velger du «Lagre som PDF» for å sende fakturaen til kunden.
      </p>
    </main>
  );
}
