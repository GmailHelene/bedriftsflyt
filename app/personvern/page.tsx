import Link from "next/link";

export const metadata = {
  title: "Personvernerklæring",
  description: "Slik behandler Bedriftsflyt personopplysninger.",
};

const h2: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 18, margin: "22px 0 6px" };

export default function Personvern() {
  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Bedriftsflyt</Link>
      </div>

      <h1 style={{ marginTop: 24 }}>Personvernerklæring</h1>
      <p className="muted">Sist oppdatert: 8. august 2026</p>

      <h2 style={h2}>1. Behandlingsansvarlig</h2>
      <p>Bedriftsflyt (enkeltpersonforetak, org.nr 927 889 404), post@bedriftsflyt.no, er behandlingsansvarlig for opplysninger om deg som bruker tjenesten. For opplysninger om dine sluttkunder er du behandlingsansvarlig, og Bedriftsflyt er databehandler.</p>

      <h2 style={h2}>2. Hvilke opplysninger vi behandler</h2>
      <p>Kontodata, betalingsopplysninger (håndteres av Vipps — vi lagrer ikke kortdata), samt booking- og kundedata som legges inn i tjenesten.</p>

      <h2 style={h2}>3. Formål og grunnlag</h2>
      <p>Vi behandler opplysningene for å levere tjenesten (avtale, personvernforordningen art. 6.1.b). Vi selger ikke personopplysninger.</p>

      <h2 style={h2}>4. Databehandlere</h2>
      <p>Vi bruker underleverandører til drift: hosting/database, KI-leverandør (Anthropic), betaling (Vipps) og SMS-leverandør. Databehandleravtaler inngås med hver av dem.</p>

      <h2 style={h2}>5. Lagring</h2>
      <p>Opplysningene lagres så lenge kundeforholdet varer, og deretter kun så lenge loven krever.</p>

      <h2 style={h2}>6. Dine rettigheter</h2>
      <p>Du har rett til innsyn, retting, sletting og dataportabilitet. Kontakt post@bedriftsflyt.no. Du kan klage til Datatilsynet.</p>

      <h2 style={h2}>7. Informasjonskapsler</h2>
      <p>Vi bruker kun nødvendige (funksjonelle) informasjonskapsler for innlogging. Vi bruker ikke sporing eller markedsføringskapsler. For å se hvor mange som besøker siden bruker vi GoatCounter, en personvernvennlig og cookieless besøksstatistikk som ikke setter informasjonskapsler eller lagrer personopplysninger.</p>

      <p className="muted" style={{ marginTop: 28, fontSize: 13 }}>
        <Link href="/">← Tilbake til forsiden</Link>
      </p>
    </main>
  );
}
