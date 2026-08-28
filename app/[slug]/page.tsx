import { notFound } from "next/navigation";
import Link from "next/link";
import { hentBedrift } from "@/lib/repository";
import { parseLang, tekster } from "@/lib/i18n";
import BookingClient from "./BookingClient";
import ChatWidget from "./ChatWidget";
import type { Metadata } from "next";

export const revalidate = 3600; // ISR: cache offentlig profil i 1 time (bedre LCP/ytelse)

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  let b = null;
  try {
    b = await hentBedrift(params.slug);
  } catch {
    // DB utilgjengelig — standard metadata
  }
  if (!b) return { title: "Bedriftsflyt" };
  return {
    title: `${b.navn} · Bedriftsflyt`,
    description: `${b.tagline} · ${b.sted}. Book time enkelt.`,
    openGraph: { title: b.navn, description: `${b.tagline} · ${b.sted}` },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { lang?: string };
}) {
  const lang = parseLang(searchParams.lang);
  const t = tekster(lang);
  let b;
  try {
    b = await hentBedrift(params.slug);
  } catch {
    return (
      <main className="wrap">
        <div className="card" style={{ padding: 20 }}>
          <h1>Midlertidig utilgjengelig</h1>
          <p className="muted">Vi klarte ikke å hente siden akkurat nå. Prøv igjen om litt.</p>
        </div>
      </main>
    );
  }
  if (!b) notFound();

  // SEO: LocalBusiness strukturert data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.navn,
    address: { "@type": "PostalAddress", addressLocality: b.sted, addressCountry: "NO" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: b.rating,
      reviewCount: b.antallVurderinger,
    },
  };

  // Merkefarge (valgt av bedriften) har prioritet, ellers bransjetema. color-mix holder det lesbart i lys/mørk.
  const aksent = b.merkefarge || b.tema?.accent;
  const temaStyle = aksent
    ? ({
        ["--accent"]: aksent,
        ["--accent-ink"]: `color-mix(in srgb, ${aksent} 60%, var(--ink))`,
        ["--accent-soft"]: `color-mix(in srgb, ${aksent} 16%, var(--surface))`,
      } as React.CSSProperties)
    : undefined;
  const coverStyle = b.tema
    ? { background: `linear-gradient(120deg, ${b.tema.coverFra}, ${b.tema.coverTil} 72%)` }
    : b.merkefarge
    ? { background: `linear-gradient(120deg, color-mix(in srgb, ${b.merkefarge} 55%, white), ${b.merkefarge} 82%)` }
    : undefined;

  return (
    <main className="wrap" style={temaStyle}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div
          style={{
            display: "inline-flex",
            border: "1px solid var(--line)",
            borderRadius: 999,
            overflow: "hidden",
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          <Link
            href={`/${b.slug}`}
            style={{
              padding: "6px 13px",
              textDecoration: "none",
              background: lang === "no" ? "var(--accent)" : "transparent",
              color: lang === "no" ? "#fff" : "var(--muted)",
            }}
          >
            NO
          </Link>
          <Link
            href={`/${b.slug}?lang=en`}
            style={{
              padding: "6px 13px",
              textDecoration: "none",
              background: lang === "en" ? "var(--accent)" : "transparent",
              color: lang === "en" ? "#fff" : "var(--muted)",
            }}
          >
            EN
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="cover" aria-hidden="true" style={coverStyle} />
        <div className="phead">
          {b.profilbilde ? (
            <img className="avatar" src={b.profilbilde} alt={b.navn} style={{ objectFit: "cover", padding: 0 }} />
          ) : (
            <div className="avatar" aria-hidden="true">
              {b.navn.charAt(0)}
            </div>
          )}
          <h1>
            {b.navn}
            {b.verifisert && <span className="verified">{t.verifisert}</span>}
          </h1>
          <p className="muted">
            {b.tagline} · {b.sted}
          </p>
          {b.antallVurderinger > 0 && (
            <p className="stars">
              ★★★★★ <b>{b.rating.toLocaleString(t.datoLocale)}</b> · {b.antallVurderinger} {t.vurderinger}
              {b.anmeldelseUrl && (
                <>
                  {" · "}
                  <a href={b.anmeldelseUrl} target="_blank" rel="noopener noreferrer">
                    {lang === "en" ? "Leave a review" : "Gi en vurdering"}
                  </a>
                </>
              )}
            </p>
          )}
        </div>

        {b.galleri && b.galleri.length > 0 && (
          <div style={{ padding: "0 22px 6px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
              {b.galleri.map((bilde, i) => (
                <img
                  key={i}
                  src={bilde}
                  alt={`${b.navn} - arbeid ${i + 1}`}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12, border: "1px solid var(--line)" }}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "0 22px 22px" }}>
          {b.depositumKr && b.depositumKr > 0 ? (
            <p
              className="muted"
              style={{ fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "var(--accent-soft)", color: "var(--accent-ink)", borderRadius: 10, fontWeight: 600 }}
            >
              {lang === "en"
                ? `Deposit of ${b.depositumKr.toLocaleString(t.datoLocale)} kr at booking`
                : `Depositum på ${b.depositumKr.toLocaleString(t.datoLocale)} kr ved booking`}
            </p>
          ) : null}
          <BookingClient slug={b.slug} bedriftNavn={b.navn} tjenester={b.tjenester} lang={lang} />
        </div>
      </div>

      <ChatWidget slug={b.slug} bedriftNavn={b.navn} lang={lang} />
    </main>
  );
}
