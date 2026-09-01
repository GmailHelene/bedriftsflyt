import Link from "next/link";

export const metadata = {
  title: "Salgsvilkår",
  description: "Salgsvilkår for Bedriftsflyt: abonnement, pris, betaling, angrerett, oppsigelse og klageadgang.",
};

const h2: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 18, margin: "22px 0 6px" };

export default function Vilkar() {
  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Bedriftsflyt</Link>
      </div>

      <h1 style={{ marginTop: 24 }}>Salgsvilkår</h1>
      <p className="muted">Sist oppdatert: 29. august 2026</p>

      <h2 style={h2}>1. Selger</h2>
      <p>
        Bedriftsflyt er et digitalt verktøy for booking, fakturering, betaling og kundedialog for små bedrifter.
        Tjenesten leveres av:
      </p>
      <p>
        Grønberg Tech Solutions (enkeltpersonforetak)<br />
        Org.nr 927 889 404 MVA<br />
        Modum, Norge<br />
        E-post: <a href="mailto:kontakt@helene.cloud">kontakt@helene.cloud</a><br />
        Telefon: <a href="tel:+4796912907">+47 969 12 907</a>
      </p>

      <h2 style={h2}>2. Pris</h2>
      <p>
        Tjenesten koster 389 kr per måned. Prisen er den totale kostnaden du betaler, og alle gebyrer er inkludert.
        De første 14 dagene er gratis, og du blir ikke belastet i prøveperioden.
      </p>

      <h2 style={h2}>3. Avtaleinngåelse</h2>
      <p>
        Avtalen er bindende når du har opprettet konto og godkjent den faste betalingsavtalen i Vipps.
        Du får en bekreftelse på e-post.
      </p>

      <h2 style={h2}>4. Betaling og fornyelse</h2>
      <p>
        Betaling skjer via Vipps (fast avtale). Første trekk skjer når den gratis prøveperioden på 14 dager er over.
        Abonnementet fornyes deretter automatisk hver måned inntil det sies opp.
      </p>

      <h2 style={h2}>5. Levering</h2>
      <p>
        Tjenesten er tilgjengelig umiddelbart etter at du har opprettet konto, og leveres som en nettbasert
        tjeneste du logger inn på. Det sendes ingen fysiske varer.
      </p>

      <h2 style={h2}>6. Angrerett</h2>
      <p>
        Bedriftsflyt selges til næringsdrivende, og angrerettloven gjelder i utgangspunktet ikke for
        næringskjøp. Vi gir deg likevel 14 dagers angrerett regnet fra den dagen avtalen ble inngått.
        Du trenger ikke oppgi noen grunn.
      </p>
      <p>
        Bruk angreretten ved å sende en melding til <a href="mailto:kontakt@helene.cloud">kontakt@helene.cloud</a>.
        Har du allerede betalt, får du beløpet tilbake innen 14 dager etter at vi har mottatt meldingen.
        I praksis rekker de fleste å bestemme seg i den gratis prøveperioden, før det er betalt noe i det hele tatt.
      </p>

      <h2 style={h2}>7. Oppsigelse</h2>
      <p>
        Det er ingen bindingstid, og du kan si opp når som helst. Du sier opp selv i Vipps-appen under
        «Faste betalinger», eller ved å sende en melding til <a href="mailto:kontakt@helene.cloud">kontakt@helene.cloud</a>.
        Oppsigelsen gjelder ut inneværende betalte periode, og det gis ikke refusjon for påbegynt periode
        utover det som følger av angreretten i punkt 6.
      </p>

      <h2 style={h2}>8. Mangler og reklamasjon</h2>
      <p>
        Fungerer ikke tjenesten som avtalt, ta kontakt på <a href="mailto:kontakt@helene.cloud">kontakt@helene.cloud</a>.
        Vi retter feilen, og lar den seg ikke rette innen rimelig tid, kan du kreve prisavslag eller heve avtalen.
      </p>

      <h2 style={h2}>9. Kundens ansvar</h2>
      <p>Kunden er ansvarlig for riktige opplysninger, lovlig bruk av tjenesten, og for egne sluttkunder og eget innhold.</p>

      <h2 style={h2}>10. Drift og tilgjengelighet</h2>
      <p>Vi tilstreber høy oppetid, men garanterer ikke uavbrutt eller feilfri drift.</p>

      <h2 style={h2}>11. Ansvarsbegrensning</h2>
      <p>Vårt ansvar er begrenset til abonnementsbeløpet, med unntak av ansvar som ikke kan fraskrives etter norsk rett (grov uaktsomhet eller forsett).</p>

      <h2 style={h2}>12. Skatteanslag</h2>
      <p>Funksjonen for skatteanslag gir et veiledende estimat og erstatter ikke autorisert regnskapsfører. Bedriftsflyt er ikke ansvarlig for faktisk skatt eller restskatt.</p>

      <h2 style={h2}>13. Endringer</h2>
      <p>Vi kan endre vilkårene og prisen med rimelig varsel. Er du uenig i endringen, kan du si opp før den trer i kraft.</p>

      <h2 style={h2}>14. Personvern</h2>
      <p>
        Se <Link href="/personvern">personvernerklæringen</Link> for hvordan vi behandler personopplysninger, og{" "}
        <Link href="/databehandleravtale">databehandleravtalen</Link> for opplysningene du selv samler inn gjennom tjenesten.
      </p>

      <h2 style={h2}>15. Klage og tvisteløsning</h2>
      <p>
        Ta først kontakt med oss på <a href="mailto:kontakt@helene.cloud">kontakt@helene.cloud</a>, så prøver vi å
        finne en løsning. Fører det ikke fram, kan en forbruker klage til Forbrukertilsynet, se{" "}
        <a href="https://www.forbrukertilsynet.no" target="_blank" rel="noopener noreferrer">forbrukertilsynet.no</a>.
        Norsk rett gjelder, og eventuelle tvister behandles av norske domstoler.
      </p>

      <p className="muted" style={{ marginTop: 28, fontSize: 13 }}>
        <Link href="/">← Tilbake til forsiden</Link>
      </p>
    </main>
  );
}
