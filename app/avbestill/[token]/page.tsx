import Link from "next/link";
import { verifiserBookingToken } from "@/lib/token";
import { hentBookingForAvbestilling } from "@/lib/repository";
import { avbestill } from "../actions";

export const metadata = { title: "Avbestill time · Bedriftsflyt" };

export default async function Avbestill({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { avbestilt?: string; feil?: string };
}) {
  const id = verifiserBookingToken(params.token);
  const info = id ? await hentBookingForAvbestilling(id) : null;
  const avbestilt = searchParams.avbestilt === "1" || info?.status === "kansellert";

  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          Bedriftsflyt
        </Link>
      </div>

      <h1 style={{ marginTop: 24 }}>Avbestilling</h1>

      {!info ? (
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <p className="muted">Vi fant ikke denne timen. Lenken kan være ugyldig eller utløpt.</p>
        </div>
      ) : avbestilt ? (
        <div className="card" style={{ padding: 20, marginTop: 16, borderColor: "var(--good)" }}>
          <b style={{ color: "var(--good)" }}>Timen er avbestilt.</b>
          <p className="muted" style={{ marginTop: 8, color: "var(--ink)" }}>
            Takk for at du ga beskjed. Vil du booke en ny tid?
          </p>
          <Link
            href={`/${info.slug}`}
            className="btn"
            style={{ width: "auto", padding: "11px 18px", textDecoration: "none", marginTop: 12, display: "inline-flex" }}
          >
            Book ny tid
          </Link>
        </div>
      ) : info.fortid ? (
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <p className="muted">Denne timen er allerede passert og kan ikke avbestilles her. Ta kontakt med {info.bedriftNavn} om noe er feil.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <p style={{ marginBottom: 4 }}>
            {info.tjeneste ?? "Time"} hos <b>{info.bedriftNavn}</b>
          </p>
          <p className="muted">{info.naar}</p>
          <form action={avbestill} style={{ marginTop: 16 }}>
            <input type="hidden" name="token" value={params.token} />
            <button className="btn" type="submit" style={{ width: "auto", padding: "12px 20px" }}>
              Bekreft avbestilling
            </button>
          </form>
          {searchParams.feil === "1" && (
            <p style={{ marginTop: 10, color: "var(--accent-ink)", fontWeight: 600 }}>Noe gikk galt. Prøv igjen.</p>
          )}
        </div>
      )}
    </main>
  );
}
