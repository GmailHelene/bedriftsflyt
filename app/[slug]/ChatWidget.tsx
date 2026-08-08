"use client";

import { useState } from "react";
import type { ChatMelding } from "@/lib/chat";

const FORSLAG = [
  "Hva koster volumvipper?",
  "Hvor lang tid tar påfyll?",
  "Kan jeg avbestille?",
  "Tar du imot nye kunder?",
];

export default function ChatWidget({ slug, bedriftNavn }: { slug: string; bedriftNavn: string }) {
  const [åpen, setÅpen] = useState(false);
  const [meldinger, setMeldinger] = useState<ChatMelding[]>([]);
  const [input, setInput] = useState("");
  const [sender, setSender] = useState(false);

  async function send(tekst: string) {
    const melding = tekst.trim();
    if (!melding || sender) return;
    const historikk = meldinger;
    setMeldinger((m) => [...m, { role: "user", content: melding }]);
    setInput("");
    setSender(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, melding, historikk }),
      });
      const d = await r.json().catch(() => ({}));
      const svar = r.ok
        ? d.svar
        : d.feil ?? "Beklager, noe gikk galt. Kontakt oss gjerne direkte.";
      setMeldinger((m) => [...m, { role: "assistant", content: svar }]);
    } catch {
      setMeldinger((m) => [
        ...m,
        { role: "assistant", content: "Nettverksfeil. Prøv igjen om litt." },
      ]);
    } finally {
      setSender(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setÅpen((v) => !v)}
        aria-label={åpen ? "Lukk chat" : "Åpne chat"}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 40,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          padding: "13px 18px",
          borderRadius: 999,
          boxShadow: "0 8px 28px rgba(36,26,34,.22)",
          cursor: "pointer",
        }}
      >
        {åpen ? "Lukk" : "✦ Spør oss"}
      </button>

      {åpen && (
        <div
          role="dialog"
          aria-label="Chat"
          style={{
            position: "fixed",
            right: 20,
            bottom: 74,
            zIndex: 41,
            width: "min(360px, calc(100vw - 40px))",
            maxHeight: "min(560px, 80vh)",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(36,26,34,.28)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-ink))", color: "#fff", padding: "13px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{bedriftNavn.split("·")[0].trim()} · assistent</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>Svarer med en gang · KI</div>
          </div>

          <div style={{ padding: 14, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 10, background: "var(--bg)" }}>
            {meldinger.length === 0 && (
              <div style={bobleStil(false)}>
                Hei! 👋 Jeg er assistenten her. Spør meg om priser, tider, sted eller avbestilling.
              </div>
            )}
            {meldinger.map((m, i) => (
              <div key={i} style={bobleStil(m.role === "user")}>
                {m.content}
              </div>
            ))}
            {sender && <div style={bobleStil(false)}>…</div>}
          </div>

          {meldinger.length === 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: "10px 14px", borderTop: "1px solid var(--line)" }}>
              {FORSLAG.map((f) => (
                <button
                  key={f}
                  onClick={() => send(f)}
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--raised)",
                    color: "var(--ink)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "7px 11px",
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--line)" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv en melding …"
              aria-label="Melding"
              style={{
                flex: 1,
                border: "1px solid var(--line)",
                borderRadius: 10,
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: 14,
                padding: "10px 12px",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={sender || !input.trim()}
              className="btn"
              style={{ width: "auto", padding: "10px 16px", opacity: sender || !input.trim() ? 0.5 : 1 }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function bobleStil(egen: boolean): React.CSSProperties {
  return {
    maxWidth: "82%",
    padding: "10px 13px",
    borderRadius: 14,
    fontSize: 13.5,
    lineHeight: 1.5,
    alignSelf: egen ? "flex-end" : "flex-start",
    background: egen ? "var(--accent)" : "var(--surface)",
    color: egen ? "#fff" : "var(--ink)",
    border: egen ? "none" : "1px solid var(--line)",
    borderBottomRightRadius: egen ? 4 : 14,
    borderBottomLeftRadius: egen ? 14 : 4,
    whiteSpace: "pre-wrap",
  };
}
