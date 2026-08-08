"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tjeneste } from "@/lib/mockData";
import { tekster, type Lang } from "@/lib/i18n";

type Props = { slug: string; bedriftNavn: string; tjenester: Tjeneste[]; lang: Lang };

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

export default function BookingClient({ slug, bedriftNavn, tjenester, lang }: Props) {
  const tx = tekster(lang);
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
      const label = i === 0 ? tx.idag : d.toLocaleDateString(tx.datoLocale, { weekday: "short", day: "numeric", month: "short" });
      out.push({ value, label });
    }
    return out;
  }, [tx.idag, tx.datoLocale]);

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
      setFeil(d.feil ?? tx.feilGenerisk);
      if (r.status === 409) {
        setTid(null);
        setValgt({ ...valgt }); // trigg ny henting av ledige tider
      }
    } catch {
      setFeil(tx.nettverksfeil);
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
        <strong style={{ color: "var(--good)" }}>{tx.bekreftetTittel}</strong>
        <p className="muted" style={{ marginTop: 8, color: "var(--ink)" }}>
          {tx.bekreftet({
            navn: navn.trim(),
            tjeneste: valgt.navn,
            dato: datoLabel,
            tid,
            bedrift: bedriftNavn,
            epost: epost.trim(),
          })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 8 }}>{tx.velgBehandling}</h2>
      <div role="radiogroup" aria-label={tx.velgBehandling} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  {t.varighetMin} {tx.min}
                </span>
              </span>
              <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{t.prisKr.toLocaleString("nb-NO")} kr</span>
            </button>
          );
        })}
      </div>

      {valgt && (
        <>
          <h2 style={{ marginTop: 20 }}>{tx.velgDag}</h2>
          <div role="radiogroup" aria-label={tx.velgDag} style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
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
          <h2 style={{ marginTop: 20 }}>{tx.velgTid}</h2>
          {laster ? (
            <p className="muted">{tx.henterTider}</p>
          ) : tider.length === 0 ? (
            <p className="muted">{tx.ingenTider}</p>
          ) : (
            <div
              role="radiogroup"
              aria-label={tx.velgTid}
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
          <h2 style={{ marginTop: 20 }}>{tx.dineOpplysninger}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>
              <span className="muted" style={{ fontSize: 13 }}>{tx.navn} *</span>
              <input value={navn} onChange={(e) => setNavn(e.target.value)} required style={inputStyle} aria-label={tx.navn} />
            </label>
            <label>
              <span className="muted" style={{ fontSize: 13 }}>{tx.mobil}</span>
              <input value={telefon} onChange={(e) => setTelefon(e.target.value)} type="tel" style={inputStyle} aria-label={tx.mobil} />
            </label>
            <label>
              <span className="muted" style={{ fontSize: 13 }}>{tx.epost}</span>
              <input value={epost} onChange={(e) => setEpost(e.target.value)} type="email" style={inputStyle} aria-label={tx.epost} />
            </label>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            {tx.ingenKonto}
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
          ? tx.booker
          : !valgt
          ? tx.velgEnBehandling
          : !dato
          ? tx.velgEnDag
          : !tid
          ? tx.velgEnTid
          : !navn.trim()
          ? tx.fyllNavn
          : tx.book(valgt.navn, tid)}
      </button>
    </div>
  );
}
