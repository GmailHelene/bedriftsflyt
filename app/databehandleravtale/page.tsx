import Link from "next/link";

/**
 * Databehandleravtale (DPA) - UTKAST, ikke juridisk kvalitetssikret.
 *
 * Bedriftens bruker av Bedriftsflyt er behandlingsansvarlig for sine egne
 * sluttkunders persondata (navn, telefon, epost samlet via booking).
 * Grønberg Tech Solutions er databehandler. GDPR art. 28 nr. 3 krever en
 * skriftlig avtale mellom partene. Dette er et FØRSTE UTKAST basert på
 * hvordan appen faktisk fungerer, ment for gjennomlesning før publisering,
 * ikke ferdig juridisk tekst. Vurder å la en jurist se over før den gjøres
 * bindende (f.eks. via avkrysning ved registrering).
 *
 * Sist oppdatert: 28. august 2026 (utkast)
 */
export const metadata = {
  title: "Databehandleravtale (utkast) - Bedriftsflyt",
  robots: { index: false, follow: false },
};

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "0 auto",
  padding: "48px 24px 96px",
  lineHeight: 1.65,
  color: "#1a202c",
};
const h1Style: React.CSSProperties = { fontSize: 30, marginBottom: 8, color: "#0A1F44" };
const subStyle: React.CSSProperties = { fontSize: 14, color: "#5e6c84", marginBottom: 24 };
const h2Style: React.CSSProperties = { fontSize: 19, marginTop: 32, marginBottom: 10, color: "#0A1F44" };
const pStyle: React.CSSProperties = { marginBottom: 12 };
const ulStyle: React.CSSProperties = { marginLeft: 24, marginBottom: 16 };
const warnBox: React.CSSProperties = {
  background: "#FFF7ED",
  border: "1px solid #FED7AA",
  borderRadius: 8,
  padding: "16px 20px",
  marginBottom: 28,
  fontSize: 14,
};

export default function DatabehandleravtalePage() {
  return (
    <main style={wrap}>
      <div style={warnBox}>
        <strong>Dette er et utkast, ikke en ferdig avtale.</strong> Innholdet under er skrevet ut fra
        hvordan Bedriftsflyt faktisk fungerer i dag, men er ikke kvalitetssikret av jurist. Les gjennom,
        rett det som ikke stemmer, og ta stilling til om noen bør se over den før den gjøres bindende
        (f.eks. ved at bedriften krysser av for at den godtar denne ved registrering).
      </div>

      <h1 style={h1Style}>Databehandleravtale, Bedriftsflyt</h1>
      <div style={subStyle}>Utkast, 28. august 2026</div>

      <p style={pStyle}>
        Denne avtalen regulerer Grønberg Tech Solutions (databehandler) sin behandling av
        personopplysninger på vegne av bedriften som bruker Bedriftsflyt (behandlingsansvarlig), i tråd
        med personvernforordningen (GDPR) artikkel 28.
      </p>

      <h2 style={h2Style}>1. Partene</h2>
      <p style={pStyle}>
        <strong>Behandlingsansvarlig:</strong> Bedriften/enkeltpersonforetaket som er registrert som
        kunde på Bedriftsflyt (identifisert ved firmanavn og e-post ved registrering).
      </p>
      <p style={pStyle}>
        <strong>Databehandler:</strong> Grønberg Tech Solutions (enkeltpersonforetak), org.nr 927 889 404
        MVA, Modum.
      </p>

      <h2 style={h2Style}>2. Formål og varighet</h2>
      <p style={pStyle}>
        Databehandleren behandler personopplysninger på vegne av den behandlingsansvarlige for å levere
        Bedriftsflyt-tjenesten: booking, fakturering og kundekommunikasjon for den behandlingsansvarliges
        sluttkunder. Avtalen gjelder så lenge den behandlingsansvarlige har et aktivt kundeforhold til
        Bedriftsflyt, og opphører når kontoen avsluttes og data er slettet, jf. punkt 7.
      </p>

      <h2 style={h2Style}>3. Hvilke personopplysninger, og om hvem</h2>
      <p style={pStyle}>Databehandleren behandler følgende personopplysninger om den behandlingsansvarliges sluttkunder, samlet inn via booking-lenken:</p>
      <ul style={ulStyle}>
        <li>Navn</li>
        <li>Telefonnummer og/eller e-postadresse</li>
        <li>Hvilken tjeneste og hvilket tidspunkt som er booket</li>
        <li>Eventuell meldingshistorikk med KI-assistenten (spørsmål om pris, åpningstid, ledig tid)</li>
      </ul>
      <p style={pStyle}>Ingen særlige kategorier persondata (helseopplysninger, etnisitet o.l.) behandles bevisst av tjenesten.</p>

      <h2 style={h2Style}>4. Databehandlerens forpliktelser</h2>
      <ul style={ulStyle}>
        <li>Behandler kun personopplysninger etter dokumenterte instrukser fra den behandlingsansvarlige (slik tjenesten er bygget og beskrevet).</li>
        <li>Sikrer at personer med tilgang til opplysningene har underlagt seg taushetsplikt.</li>
        <li>Gjennomfører tekniske og organisatoriske sikkerhetstiltak, jf. GDPR art. 32 (kryptering i transitt, tilgangsbegrensning, rate-limiting mot misbruk).</li>
        <li>Bistår den behandlingsansvarlige med å svare på henvendelser fra sluttkunder som ønsker å bruke sine rettigheter (innsyn, retting, sletting).</li>
        <li>Varsler den behandlingsansvarlige uten ugrunnet opphold ved brudd på personopplysningssikkerheten som gjelder dennes sluttkunder.</li>
      </ul>

      <h2 style={h2Style}>5. Underdatabehandlere</h2>
      <p style={pStyle}>Den behandlingsansvarlige gir generell godkjenning til at databehandleren bruker følgende underdatabehandlere:</p>
      <ul style={ulStyle}>
        <li><strong>Railway</strong> - hosting og database</li>
        <li><strong>Anthropic</strong> - språkmodell for KI-assistenten som svarer sluttkunder</li>
        <li><strong>Vipps</strong> - betaling av faktura og faste avtaler</li>
        <li><strong>Brevo</strong> - utsending av bookingbekreftelser og påminnelser på e-post</li>
      </ul>
      <p style={pStyle}>
        Databehandleren informerer den behandlingsansvarlige ved planlagte endringer i denne listen, slik at det er mulig å protestere før endringen trer i kraft.
      </p>

      <h2 style={h2Style}>6. Overføring utenfor EU/EØS</h2>
      <p style={pStyle}>
        Railway-databasen for Bedriftsflyt kjører i EU-vest, ingen overføring ut av EU/EØS for booking-
        og kontodata. Vipps og Brevo behandler data i Norge/EU. Anthropic (KI-assistenten) er et
        amerikansk selskap, og behandling av kundedialog kan skje på infrastruktur utenfor EU/EØS.
        Overføringsgrunnlaget er EUs standardklausuler (SCC), som Anthropic tilbyr i sin egen
        databehandleravtale. <em>[Vurder å be Anthropic bekrefte SCC-status skriftlig, og legg ved som
        vedlegg, hvis denne avtalen skal gjøres fullt bindende.]</em>
      </p>

      <h2 style={h2Style}>7. Sletting eller retur ved avtaleslutt</h2>
      <p style={pStyle}>
        Ved avsluttet kundeforhold slettes eller anonymiseres bookingdata om sluttkunder senest 12
        måneder etter siste aktivitet, med unntak av fakturadata som lagres i minimum 5 år etter
        bokføringsloven §13. Den behandlingsansvarlige kan når som helst be om at data slettes tidligere,
        med mindre lovpålagt oppbevaringsplikt er til hinder for det.
      </p>

      <h2 style={h2Style}>8. Kontroll</h2>
      <p style={pStyle}>
        Den behandlingsansvarlige kan be om dokumentasjon som viser at databehandleren oppfyller sine
        forpliktelser etter denne avtalen. Kontakt <a href="mailto:kontakt@helene.cloud">kontakt@helene.cloud</a>.
      </p>

      <div style={{ marginTop: 40, fontSize: 14 }}>
        <Link href="/personvern" style={{ color: "#1E3A5F" }}>
          &larr; Tilbake til personvernerklæringen
        </Link>
      </div>
    </main>
  );
}
