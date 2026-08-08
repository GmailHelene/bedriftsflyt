"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tjeneste } from "@/lib/mockData";

type Props = { slug: string; bedriftNavn: string; tjenester: Tjeneste[] };

const inputStyle: React.CSSProperties = {
  padding: "11px 13px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 15,
  fontFamily: "inherit",
  width: "100%",
};

function pilleStil(aktiv: boolean): React.CSSProperties {
  return {
    padding: "10px 12px",
    border: `1px solid ${aktiv ? "var(--accent)" : "var(--line)"}`,
    background: aktiv ? "var(--accent)" : "var(--surface)",
    color: aktiv ? "#fff" : "var(--ink)",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  };
}

export default function BookingClient({ slug, bedriftNavn, tjenester }: Props) {
  const [valgt, setValgt] = useState<Tjeneste | null>(null);
  const [dato, setDato] = useState<string | null>(null);
  const [tider, setTider] = useState<string[]>([]);
  const [laster, setLaster] = useState(false);
  const [tid, setTid] = useState<string | null>(null);
  const [navn, setNavn] = useState("");
  const [telefon, setTelefon] = useState("");
  const [epost, setEpost] = useState("");
  const [sender, setSender] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [ferdig, setFerdig] = useState(false);

  const dager = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (d.getDay() === 0) continue; // søndag stengt
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const label = i === 0 ? "I dag" : d.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" });
      out.push({ value, label });
    }
    return out;
  }, []);

  useEffect(() => {
    if (!valgt || !dato) {
      setTider([]);
      return;
    }
    let avbrutt = false;
    setLaster(true);
    setTid(null);
    fetch(`/api/tilgjengelighet?slug=${encodeURIComponent(slug)}&service=${encodeURIComponent(valgt.id)}&dato=${dato}`)
      .then((r) => r.json())
      .then((d) => {
        if (!avbrutt) setTider(Array.isArray(d.tider) ? d.tider : []);
      })
      .catch(() => {
        if (!avbrutt) setTider([]);
      })
      .finally(() => {
        if (!avbrutt) setLaster(false);
      });
    return () => {
      avbrutt = true;
    };
  }, [valgt, dato, slug]);

  async function book() {
    if (!valgt || !dato || !tid || !navn.trim()) return;
    setSender(true);
    setFeil(null);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          service: valgt.id,
          dato,
          tid,
          navn: navn.trim(),
          telefon: telefon.trim() || undefined,
          epost: epost.trim() || undefined,
        }),
      });
      if (r.status === 201) {
        setFerdig(true);
        return;
      }
      const d = await r.json().catch(() => ({}));
      setFeil(d.feil ?? "Noe gikk galt. Prøv igjen.");
      if (r.status === 409) {
        setTid(null);
        setValgt({ ...valgt }); // trigg ny henting av ledige tider
      }
    } catch {
      setFeil("Nettverksfeil. Prøv igjen.");
    } finally {
      setSender(false);
    }
  }

  if (ferdig && valgt && dato && tid) {
    const datoLabel = dager.find((d) => d.value === dato)?.label ?? dato;
    return (
      <div
        className="card"
        style={{ padding: 16, borderColor: "var(--good)", background: "color-mix(in srgb, var(--good) 8%, transparent)" }}
      >
        <strong style={{ color: "var(--good)" }}>✓ Booking bekreftet</strong>
        <p className="muted" style={{ marginTop: 8, color: "var(--ink)" }}>
          {navn.trim()}, du er booket for <b>{valgt.navn.toLowerCase()}</b> {datoLabel} kl {tid} hos {bedriftNavn}.
          Vi sender en bekreftelse{epost.trim() ? ` til ${epost.trim()}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 8 }}>Velg behandling</h2>
      <div role="radiogroup" aria-label="Velg behandling" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tjenester.map((t) => {
          const aktiv = valgt?.id === t.id;
          return (
            <button
              key={t.id}
              role="radio"
              aria-checked={aktiv}
              onClick={() => {
                setValgt(t);
                setDato(null);
                setTid(null);
                setFeil(null);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 15px",
                border: `1px solid ${aktiv ? "var(--accent)" : "var(--line)"}`,
                background: aktiv ? "var(--accent-soft)" : "var(--surface)",
                borderRadius: 12,
                textAlign: "left",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <span style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{t.navn}</span>
                <br />
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {t.varighetMin} min
                </span>
              </span>
              <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{t.prisKr.toLocaleString("nb-NO")} kr</span>
            </button>
          );
        })}
      </div>

      {valgt && (
        <>
          <h2 style={{ marginTop: 20 }}>Velg dag</h2>
          <div role="radiogroup" aria-label="Velg dag" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {dager.map((d) => (
              <button
                key={d.value}
                role="radio"
                aria-checked={dato === d.value}
                onClick={() => setDato(d.value)}
                style={{ ...pilleStil(dato === d.value), whiteSpace: "nowrap", flex: "0 0 auto" }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}

      {valgt && dato && (
        <>
          <h2 style={{ marginTop: 20 }}>Velg tid</h2>
          {laster ? (
            <p className="muted">Henter ledige tider …</p>
          ) : tider.length === 0 ? (
            <p className="muted">Ingen ledige tider denne dagen. Prøv en annen dag.</p>
          ) : (
            <div
              role="radiogroup"
              aria-label="Velg tid"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}
            >
              {tider.map((t) => (
                <button
                  key={t}
                  role="radio"
                  aria-checked={tid === t}
                  onClick={() => {
                    setTid(t);
                    setFeil(null);
                  }}
                  style={pilleStil(tid === t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {valgt && dato && tid && (
        <>
          <h2 style={{ marginTop: 20 }}>Dine opplysninger</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>
              <span className="muted" style={{ fontSize: 13 }}>Navn *</span>
              <input value={navn} onChange={(e) => setNavn(e.target.value)} required style={inputStyle} aria-label="Navn" />
            </label>
            <label>
              <span className="muted" style={{ fontSize: 13 }}>Mobil</span>
              <input value={telefon} onChange={(e) => setTelefon(e.target.value)} type="tel" style={inputStyle} aria-label="Mobil" />
            </label>
            <label>
              <span className="muted" style={{ fontSize: 13 }}>E-post</span>
              <input value={epost} onChange={(e) => setEpost(e.target.value)} type="email" style={inputStyle} aria-label="E-post" />
            </label>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Ingen konto nødvendig. Vi bruker opplysningene kun til denne bookingen.
          </p>
        </>
      )}

      {feil && (
        <p style={{ color: "var(--accent-ink)", fontWeight: 600, marginTop: 14 }} role="alert">
          {feil}
        </p>
      )}

      <button className="btn" style={{ marginTop: 16 }} disabled={!valgt || !dato || !tid || !navn.trim() || sender} onClick={book}>
        {sender
          ? "Booker …"
          : !valgt
          ? "Velg en behandling"
          : !dato
          ? "Velg en dag"
          : !tid
          ? "Velg en tid"
          : !navn.trim()
          ? "Fyll inn navn"
          : `Book ${valgt.navn} · kl ${tid}`}
      </button>
    </div>
  );
}
