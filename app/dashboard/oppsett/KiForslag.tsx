"use client";

import { useState } from "react";

// Fyller chatbot-feltene (adresse, avbestilling, tone, faq) via KI, ut fra en kort beskrivelse.
export default function KiForslag() {
  const [beskrivelse, setBeskrivelse] = useState("");
  const [busy, setBusy] = useState(false);
  const [feil, setFeil] = useState("");
  const [ferdig, setFerdig] = useState(false);

  async function foresla() {
    setBusy(true);
    setFeil("");
    setFerdig(false);
    try {
      const res = await fetch("/api/chatbot-forslag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ beskrivelse }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFeil(d.feil ?? "Noe gikk galt.");
        return;
      }
      const f = d.forslag ?? {};
      const sett = (id: string, val: string) => {
        const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el && val) el.value = val;
      };
      sett("adresse", f.adresse);
      sett("avbestilling", f.avbestilling);
      sett("tone", f.tone);
      sett("faq", f.faq);
      setFerdig(true);
    } catch {
      setFeil("Nettverksfeil. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "var(--accent-soft)", borderRadius: 12, padding: 14, marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-ink)" }}>La KI fylle ut for deg</div>
      <p className="muted" style={{ fontSize: 13, margin: "4px 0 8px" }}>
        Beskriv bedriften din i én-to setninger, så foreslår KI feltene under. Du kan redigere etterpå.
      </p>
      <textarea
        value={beskrivelse}
        onChange={(e) => setBeskrivelse(e.target.value)}
        rows={2}
        placeholder="F.eks. Jeg tar vipper og bryn hjemme i Hamar, avbestilling senest dagen før."
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid var(--line)",
          borderRadius: 10,
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: 14,
          fontFamily: "inherit",
          resize: "vertical",
          lineHeight: 1.5,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <button
          type="button"
          className="btn"
          onClick={foresla}
          disabled={busy || !beskrivelse.trim()}
          style={{ width: "auto", padding: "9px 16px", opacity: busy || !beskrivelse.trim() ? 0.5 : 1 }}
        >
          {busy ? "Tenker …" : "Foreslå med KI"}
        </button>
        {ferdig && <span style={{ color: "var(--good)", fontSize: 13, fontWeight: 600 }}>Fylt ut ✓ Husk å lagre.</span>}
      </div>
      {feil && <p style={{ color: "var(--accent-ink)", fontSize: 13, marginTop: 6 }}>{feil}</p>}
    </div>
  );
}
