import Link from "next/link";

export const metadata = {
  title: "Salgsvilkår",
  description: "Salgsvilkår for Bedriftsflyt — abonnement, betaling, oppsigelse og ansvar.",
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
      <p className="muted">Sist oppdatert: 8. august 2026</p>

      <h2 style={h2}>1. Om tjenesten</h2>
      <p>Bedriftsflyt er et digitalt verktøy for booking, fakturering, betaling og kundedialog for små bedrifter, levert av Bedriftsflyt (enkeltpersonforetak, org.nr 927 889 404).</p>

      <h2 style={h2}>2. Abonnement og pris</h2>
      <p>Tjenesten koster 389 kr per måned. Første måned er gratis. Det er ingen bindingstid.</p>

      <h2 style={h2}>3. Betaling og fornyelse</h2>
      <p>Betaling skjer via Vipps. Abonnementet fornyes automatisk hver måned inntil det sies opp.</p>

      <h2 style={h2}>4. Oppsigelse</h2>
      <p>Du kan si opp når som helst. Oppsigelsen gjelder ut inneværende betalte periode. Det gis ikke refusjon for påbegynt periode.</p>

      <h2 style={h2}>5. Kundens ansvar</h2>
      <p>Kunden er ansvarlig for riktige opplysninger, lovlig bruk av tjenesten, og for egne sluttkunder og eget innhold.</p>

      <h2 style={h2}>6. Drift og tilgjengelighet</h2>
      <p>Vi tilstreber høy oppetid, men garanterer ikke uavbrutt eller feilfri drift.</p>

      <h2 style={h2}>7. Ansvarsbegrensning</h2>
      <p>Vårt ansvar er begrenset til abonnementsbeløpet, med unntak av ansvar som ikke kan fraskrives etter norsk rett (grov uaktsomhet eller forsett).</p>

      <h2 style={h2}>8. Skatt-avsetning</h2>
      <p>Funksjonen for skatt-avsetning gir et veiledende estimat og erstatter ikke autorisert regnskapsfører. Bedriftsflyt er ikke ansvarlig for faktisk skatt eller restskatt.</p>

      <h2 style={h2}>9. Endringer</h2>
      <p>Vi kan endre vilkårene og prisen med rimelig varsel.</p>

      <h2 style={h2}>10. Personvern</h2>
      <p>Se <Link href="/personvern">personvernerklæringen</Link> for hvordan vi behandler personopplysninger.</p>

      <h2 style={h2}>11. Kontakt og verneting</h2>
      <p>Kontakt: post@bedriftsflyt.no. Norsk rett gjelder.</p>

      <p className="muted" style={{ marginTop: 28, fontSize: 13 }}>
        <Link href="/">← Tilbake til forsiden</Link>
      </p>
    </main>
  );
}
