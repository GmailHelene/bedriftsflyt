import { notFound } from "next/navigation";
import { hentBedrift } from "@/lib/repository";
import BookingClient from "./BookingClient";
import ChatWidget from "./ChatWidget";
import type { Metadata } from "next";

export const revalidate = 3600; // ISR: cache offentlig profil i 1 time (bedre LCP/ytelse)

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const b = await hentBedrift(params.slug);
  if (!b) return { title: "Bedriftsflyt" };
  return {
    title: `${b.navn} · Bedriftsflyt`,
    description: `${b.tagline} · ${b.sted}. Book time enkelt.`,
    openGraph: { title: b.navn, description: `${b.tagline} · ${b.sted}` },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const b = await hentBedrift(params.slug);
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

  return (
    <main className="wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="card">
        <div className="cover" aria-hidden="true" />
        <div className="phead">
          <div className="avatar" aria-hidden="true">
            {b.navn.charAt(0)}
          </div>
          <h1>
            {b.navn}
            {b.verifisert && <span className="verified">✓ Verifisert</span>}
          </h1>
          <p className="muted">
            {b.tagline} · {b.sted}
          </p>
          <p className="stars">
            ★★★★★ <b>{b.rating.toLocaleString("nb-NO")}</b> · {b.antallVurderinger} vurderinger
          </p>
        </div>

        <div style={{ padding: "0 22px 22px" }}>
          <BookingClient slug={b.slug} bedriftNavn={b.navn} tjenester={b.tjenester} />
        </div>
      </div>

      <ChatWidget slug={b.slug} bedriftNavn={b.navn} />
    </main>
  );
}
