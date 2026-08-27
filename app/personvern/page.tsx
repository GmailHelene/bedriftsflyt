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
      <p>Bedriftsflyt er et produkt fra Grønberg Tech Solutions (enkeltpersonforetak, org.nr 927 889 404). Grønberg Tech Solutions, post@bedriftsflyt.no, er behandlingsansvarlig for opplysninger om deg som bruker tjenesten. For opplysninger om dine sluttkunder er du behandlingsansvarlig, og Grønberg Tech Solutions er databehandler.</p>

      <h2 style={h2}>2. Hvilke opplysninger vi behandler</h2>
      <p>Kontodata for deg som bedrift, betalingsopplysninger (håndteres av Stripe og/eller Vipps, vi lagrer ikke kortdata), samt booking- og kundedata som legges inn i tjenesten.</p>
      <p>Om dine sluttkunder (de som booker time hos deg) samler tjenesten kun det som trengs for selve bookingen: navn, telefonnummer og/eller e-post, og hvilken tjeneste og tid som er booket. Dette samles inn av deg som avtaleinngåelse med din sluttkunde, ikke av Grønberg Tech Solutions direkte, se punkt 1.</p>

      <h2 style={h2}>3. Formål og grunnlag</h2>
      <p>Vi behandler opplysningene for å levere tjenesten (avtale, personvernforordningen art. 6.1.b). Vi selger ikke personopplysninger.</p>

      <h2 style={h2}>4. Databehandlere</h2>
      <p>Vi bruker underleverandører til drift: hosting og database (Railway), KI-leverandør (Anthropic, for KI-assistenten som svarer på vanlige spørsmål fra dine sluttkunder), betaling og abonnement (Stripe eller Vipps, du velger selv som bedrift), innlogging for deg som bedrift (Vipps Login), betaling av faktura for din sluttkunde (Vipps), og e-postleverandør (Brevo), som blant annet sender bookingbekreftelser og påminnelser på e-post. Databehandleravtale inngås med hver av dem.</p>
      <p>Fordi KI-assistenten kan svare på meldinger fra dine sluttkunder, kan innholdet i disse meldingene sendes til Anthropic for å generere svaret. Vi sender ikke mer enn det som trengs for å svare på henvendelsen.</p>

      <h2 style={h2}>5. Lagring</h2>
      <p>Kontodata og bookingdata lagres så lenge kundeforholdet varer, og slettes eller anonymiseres deretter. Fakturadata (beløp, dato, hva som er fakturert) lagres i minimum 5 år etter utstedelse, som bokføringsloven §13 krever, selv om kontoen for øvrig avsluttes.</p>

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
