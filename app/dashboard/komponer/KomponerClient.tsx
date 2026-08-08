"use client";

import { useState } from "react";
import type { SVGProps } from "react";
import { KameraIkon, StjerneIkon, SokIkon } from "@/app/icons";

type KomponerType = "instagram" | "anmeldelse" | "google";

const VALG: { type: KomponerType; Ikon: (p: SVGProps<SVGSVGElement> & { size?: number }) => JSX.Element; navn: string; hint: string }[] = [
  { type: "instagram", Ikon: KameraIkon, navn: "Instagram-post", hint: "F.eks. ledige timer denne uka, eller en ny behandling" },
  { type: "anmeldelse", Ikon: StjerneIkon, navn: "Svar på anmeldelse", hint: "Lim inn anmeldelsen du vil svare på" },
  { type: "google", Ikon: SokIkon, navn: "Google-beskrivelse", hint: "F.eks. hva som gjør deg spesiell" },
];

export default function KomponerClient() {
  const [type, setType] = useState<KomponerType>("instagram");
  const [kontekst, setKontekst] = useState("");
  const [resultat, setResultat] = useState("");
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState("");
  const [kopiert, setKopiert] = useState(false);

  const valgt = VALG.find((v) => v.type === type)!;

  async function generer() {
    setLaster(true);
    setFeil("");
    setResultat("");
    setKopiert(false);
    try {
      const res = await fetch("/api/komponer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, kontekst }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeil(data.feil ?? "Noe gikk galt.");
      } else {
        setResultat(data.tekst ?? "");
      }
    } catch {
      setFeil("Nettverksfeil. Prøv igjen.");
    } finally {
      setLaster(false);
    }
  }

  async function kopier() {
    try {
      await navigator.clipboard.writeText(resultat);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    } catch {
      /* ignorer */
    }
  }

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

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 20 }}>
        {VALG.map((v) => {
          const aktiv = v.type === type;
          const Ikon = v.Ikon;
          return (
            <button
              key={v.type}
              type="button"
              onClick={() => {
                setType(v.type);
                setResultat("");
                setFeil("");
              }}
              className="card"
              style={{
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
                borderColor: aktiv ? "var(--accent)" : "var(--line)",
                background: aktiv ? "var(--accent-soft)" : "var(--surface)",
                color: "var(--ink)",
              }}
              aria-pressed={aktiv}
            >
              <div style={{ color: aktiv ? "var(--accent-ink)" : "var(--muted)" }}>
                <Ikon size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{v.navn}</div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <label>
          <span className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Hva skal teksten handle om?
          </span>
          <textarea
            value={kontekst}
            onChange={(e) => setKontekst(e.target.value)}
            rows={4}
            placeholder={valgt.hint}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </label>
        <button
          type="button"
          className="btn"
          onClick={generer}
          disabled={laster}
          style={{ marginTop: 14, width: "auto", padding: "12px 22px" }}
        >
          {laster ? "Skriver …" : "Lag tekst"}
        </button>
      </div>

      {feil && (
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: "var(--accent)" }}>
          <span className="muted">{feil}</span>
        </div>
      )}

      {resultat && (
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0 }}>Forslag</h2>
            <button
              type="button"
              onClick={kopier}
              className="btn-ghost"
              style={{
                marginLeft: "auto",
                border: "1px solid var(--accent)",
                borderRadius: 9,
                padding: "7px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {kopiert ? "Kopiert ✓" : "Kopier"}
            </button>
          </div>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 12, lineHeight: 1.6 }}>{resultat}</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Les alltid gjennom før du publiserer. Du kan lage flere forslag med samme knapp.
          </p>
        </div>
      )}
    </>
  );
}
