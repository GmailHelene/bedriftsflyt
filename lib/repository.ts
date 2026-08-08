// Data-lag: bruker Postgres hvis DATABASE_URL er satt, ellers mock-data.
// Slik er appen kjørbar både med og uten database (M1→M2-overgang).
import { getPool, query } from "./db";
import { getBedrift as getMockBedrift, type Bedrift, type Tjeneste } from "./mockData";

type BusinessRow = {
  id: string;
  slug: string;
  navn: string;
  tagline: string | null;
  sted: string | null;
  verifisert: boolean;
  rating: string;
  antall_vurderinger: number;
  ledige_tider: string[] | null;
};

type ServiceRow = {
  id: string;
  navn: string;
  pris_kr: number;
  varighet_min: number;
};

export async function hentBedrift(slug: string): Promise<Bedrift | null> {
  if (!getPool()) return getMockBedrift(slug);

  const rows = await query<BusinessRow>(
    `select id, slug, navn, tagline, sted, verifisert, rating, antall_vurderinger, ledige_tider
       from businesses where slug = $1 limit 1`,
    [slug]
  );
  const b = rows[0];
  if (!b) return null;

  const services = await query<ServiceRow>(
    `select id, navn, pris_kr, varighet_min
       from services where business_id = $1 and aktiv = true order by pris_kr desc`,
    [b.id]
  );

  return {
    slug: b.slug,
    navn: b.navn,
    tagline: b.tagline ?? "",
    sted: b.sted ?? "",
    verifisert: b.verifisert,
    rating: Number(b.rating),
    antallVurderinger: b.antall_vurderinger,
    tjenester: services.map(
      (s): Tjeneste => ({ id: s.id, navn: s.navn, prisKr: s.pris_kr, varighetMin: s.varighet_min })
    ),
    ledigeTider: b.ledige_tider ?? [],
  };
}

// ---- Skriv (Milepæl 6) — krever database (DATABASE_URL) ----

export async function oppdaterProfil(
  slug: string,
  data: { navn: string; tagline: string; sted: string }
): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    "update businesses set navn = $2, tagline = $3, sted = $4 where slug = $1",
    [slug, data.navn, data.tagline, data.sted]
  );
  return true;
}

export async function leggTilTjeneste(
  slug: string,
  t: { id: string; navn: string; prisKr: number; varighetMin: number }
): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    `insert into services (id, business_id, navn, pris_kr, varighet_min)
       select $2, b.id, $3, $4, $5 from businesses b where b.slug = $1
     on conflict (business_id, id)
       do update set navn = excluded.navn, pris_kr = excluded.pris_kr, varighet_min = excluded.varighet_min`,
    [slug, t.id, t.navn, t.prisKr, t.varighetMin]
  );
  return true;
}

export async function slettTjeneste(slug: string, id: string): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    "delete from services using businesses b where services.business_id = b.id and b.slug = $1 and services.id = $2",
    [slug, id]
  );
  return true;
}

// ---- Booking (Milepæl 3-fullføring) ----

// Åpningstider (MVP: fast 09–17, man–lør). Gjøres per-bedrift konfigurerbart senere.
// Postgres håndterer Europe/Oslo-konvertering (sommer-/vintertid) via "at time zone".
const LEDIGE_TIDER_SQL = `
  select to_char(g, 'HH24:MI') as tid
  from generate_series($1::date + time '09:00', $1::date + time '17:00', interval '30 min') as g
  where extract(dow from g) <> 0                                   -- ikke søndag
    and (g + make_interval(mins => $3::int)) <= ($1::date + time '17:00')
    and (g at time zone 'Europe/Oslo') > now()                      -- ikke i fortid
    and not exists (
      select 1 from bookings bk
      where bk.business_id = $2
        and bk.status <> 'kansellert'
        and bk.tidsrom && tstzrange(
          (g at time zone 'Europe/Oslo'),
          ((g + make_interval(mins => $3::int)) at time zone 'Europe/Oslo')
        )
    )
  order by g
`;

export async function hentLedigeTider(slug: string, serviceId: string, dato: string): Promise<string[]> {
  if (!getPool()) {
    const b = getMockBedrift(slug); // uten DB: vis eksempel-tider (demo)
    return b ? b.ledigeTider : [];
  }
  const biz = await query<{ id: string }>("select id from businesses where slug = $1", [slug]);
  if (!biz[0]) return [];
  const svc = await query<{ varighet_min: number }>(
    "select varighet_min from services where business_id = $1 and id = $2 and aktiv = true",
    [biz[0].id, serviceId]
  );
  if (!svc[0]) return [];
  const rows = await query<{ tid: string }>(LEDIGE_TIDER_SQL, [dato, biz[0].id, svc[0].varighet_min]);
  return rows.map((r) => r.tid);
}

export type DashBooking = {
  id: string;
  naar: string; // "DD.MM HH:MM" (Europe/Oslo)
  tjeneste: string;
  kundeNavn: string | null;
  kundeTelefon: string | null;
};

export async function hentBookinger(slug: string): Promise<DashBooking[]> {
  if (!getPool()) return [];
  const rows = await query<{
    id: string;
    naar: string;
    tjeneste: string | null;
    kunde_navn: string | null;
    kunde_telefon: string | null;
  }>(
    `select bk.id,
            to_char(bk.starttid at time zone 'Europe/Oslo', 'DD.MM HH24:MI') as naar,
            s.navn as tjeneste,
            c.navn as kunde_navn,
            c.telefon as kunde_telefon
       from bookings bk
       join businesses b on b.id = bk.business_id
       left join services s on s.business_id = bk.business_id and s.id = bk.service_id
       left join customers c on c.id = bk.customer_id
      where b.slug = $1
        and bk.status <> 'kansellert'
        and bk.starttid >= now() - interval '1 hour'
      order by bk.starttid
      limit 50`,
    [slug]
  );
  return rows.map((r) => ({
    id: r.id,
    naar: r.naar,
    tjeneste: r.tjeneste ?? "—",
    kundeNavn: r.kunde_navn,
    kundeTelefon: r.kunde_telefon,
  }));
}

export type BookingResultat =
  | { ok: true }
  | { ok: false; grunn: "ingen_db" | "ugyldig" | "opptatt" };

export async function opprettBooking(input: {
  slug: string;
  serviceId: string;
  dato: string; // YYYY-MM-DD
  tid: string; // HH:MM
  navn: string;
  telefon?: string;
  epost?: string;
}): Promise<BookingResultat> {
  const pool = getPool();
  if (!pool) return { ok: false, grunn: "ingen_db" };

  const client = await pool.connect();
  try {
    const biz = await client.query("select id from businesses where slug = $1", [input.slug]);
    if (!biz.rows[0]) return { ok: false, grunn: "ugyldig" };
    const businessId = biz.rows[0].id as string;

    const svc = await client.query(
      "select varighet_min from services where business_id = $1 and id = $2 and aktiv = true",
      [businessId, input.serviceId]
    );
    if (!svc.rows[0]) return { ok: false, grunn: "ugyldig" };
    const varighet = svc.rows[0].varighet_min as number;

    const lokal = `${input.dato} ${input.tid}`; // naiv Oslo-lokal tid

    await client.query("begin");
    const cust = await client.query(
      "insert into customers (business_id, navn, telefon, epost) values ($1, $2, $3, $4) returning id",
      [businessId, input.navn, input.telefon ?? null, input.epost ?? null]
    );
    await client.query(
      `insert into bookings (business_id, service_id, customer_id, starttid, sluttid, tidsrom)
       values (
         $1, $2, $3,
         ($4::timestamp at time zone 'Europe/Oslo'),
         (($4::timestamp + make_interval(mins => $5::int)) at time zone 'Europe/Oslo'),
         tstzrange(
           ($4::timestamp at time zone 'Europe/Oslo'),
           (($4::timestamp + make_interval(mins => $5::int)) at time zone 'Europe/Oslo')
         )
       )`,
      [businessId, input.serviceId, cust.rows[0].id, lokal, varighet]
    );
    await client.query("commit");
    return { ok: true };
  } catch (e: unknown) {
    await client.query("rollback").catch(() => {});
    // 23P01 = exclusion_violation → tiden overlapper en eksisterende booking
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23P01") {
      return { ok: false, grunn: "opptatt" };
    }
    throw e;
  } finally {
    client.release();
  }
}

// ---- Faktura + skatt-avsetning (Milepæl 4) ----

export type DashFaktura = {
  id: string;
  naar: string;
  beskrivelse: string;
  sumKr: number;
  status: string;
  skattAvsattKr: number;
  reference: string;
};

export async function opprettFaktura(
  slug: string,
  data: { beskrivelse: string; belopKr: number }
): Promise<boolean> {
  if (!getPool()) return false;
  const linjer = JSON.stringify([{ navn: data.beskrivelse, kr: data.belopKr }]);
  const sumOre = Math.round(data.belopKr * 100);
  await query(
    `insert into invoices (business_id, linjer, sum_ore, status, vipps_ref)
       select b.id, $2::jsonb, $3, 'opprettet', 'bf-' || replace(gen_random_uuid()::text, '-', '')
       from businesses b where b.slug = $1`,
    [slug, linjer, sumOre]
  );
  return true;
}

export async function hentFakturaer(slug: string): Promise<DashFaktura[]> {
  if (!getPool()) return [];
  const rows = await query<{
    id: string;
    naar: string;
    beskrivelse: string | null;
    sum_ore: number;
    status: string;
    skatt_avsatt_ore: number;
    vipps_ref: string | null;
  }>(
    `select i.id,
            to_char(i.created_at at time zone 'Europe/Oslo', 'DD.MM HH24:MI') as naar,
            (i.linjer->0->>'navn') as beskrivelse,
            i.sum_ore, i.status, i.skatt_avsatt_ore, i.vipps_ref
       from invoices i join businesses b on b.id = i.business_id
      where b.slug = $1
      order by i.created_at desc limit 50`,
    [slug]
  );
  return rows.map((r) => ({
    id: r.id,
    naar: r.naar,
    beskrivelse: r.beskrivelse ?? "Faktura",
    sumKr: r.sum_ore / 100,
    status: r.status,
    skattAvsattKr: r.skatt_avsatt_ore / 100,
    reference: r.vipps_ref ?? "",
  }));
}

export async function hentSkattAvsatt(slug: string): Promise<number> {
  if (!getPool()) return 0;
  const rows = await query<{ ore: string }>(
    `select coalesce(t.avsatt_ore_total, 0)::text as ore
       from businesses b left join tax_reserve t on t.business_id = b.id
      where b.slug = $1`,
    [slug]
  );
  return rows[0] ? Number(rows[0].ore) / 100 : 0;
}

export async function hentFakturaForBetaling(
  reference: string
): Promise<{ sumOre: number; beskrivelse: string } | null> {
  if (!getPool()) return null;
  const rows = await query<{ sum_ore: number; beskrivelse: string | null }>(
    "select sum_ore, (linjer->0->>'navn') as beskrivelse from invoices where vipps_ref = $1 limit 1",
    [reference]
  );
  const r = rows[0];
  return r ? { sumOre: r.sum_ore, beskrivelse: r.beskrivelse ?? "Betaling" } : null;
}

// Markerer faktura betalt + setter av 35 % til skatt. Idempotent (kjøres av webhook).
export async function markerFakturaBetalt(reference: string): Promise<{ ok: boolean }> {
  const pool = getPool();
  if (!pool) return { ok: false };
  const client = await pool.connect();
  try {
    await client.query("begin");
    const r = await client.query(
      "select business_id, sum_ore, status from invoices where vipps_ref = $1 for update",
      [reference]
    );
    const row = r.rows[0];
    if (!row) {
      await client.query("rollback");
      return { ok: false };
    }
    if (row.status === "betalt") {
      await client.query("commit");
      return { ok: true }; // allerede behandlet
    }
    const skatt = Math.round((row.sum_ore as number) * 0.35);
    await client.query(
      "update invoices set status = 'betalt', skatt_avsatt_ore = $2 where vipps_ref = $1",
      [reference, skatt]
    );
    await client.query(
      `insert into tax_reserve (business_id, avsatt_ore_total) values ($1, $2)
       on conflict (business_id) do update set avsatt_ore_total = tax_reserve.avsatt_ore_total + $2`,
      [row.business_id, skatt]
    );
    await client.query("commit");
    return { ok: true };
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// ---- Vipps Login: eierskap ----

export async function finnBedriftForEier(sub: string): Promise<string | null> {
  if (!getPool()) return null;
  const rows = await query<{ slug: string }>(
    "select slug from businesses where owner_vipps_sub = $1 limit 1",
    [sub]
  );
  return rows[0]?.slug ?? null;
}

export async function koblEierTilBedrift(sub: string, slug: string): Promise<boolean> {
  if (!getPool()) return false;
  const rows = await query<{ slug: string }>(
    "update businesses set owner_vipps_sub = $1 where slug = $2 and owner_vipps_sub is null returning slug",
    [sub, slug]
  );
  return rows.length > 0;
}

// ---- Vipps Recurring: abonnement ----

export async function settAbonnement(slug: string, agreementId: string, status: string): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    "update businesses set abonnement_agreement_id = $2, abonnement_status = $3 where slug = $1",
    [slug, agreementId, status]
  );
  return true;
}

export async function hentAbonnement(slug: string): Promise<{ agreementId: string | null; status: string | null }> {
  if (!getPool()) return { agreementId: null, status: null };
  const rows = await query<{ abonnement_agreement_id: string | null; abonnement_status: string | null }>(
    "select abonnement_agreement_id, abonnement_status from businesses where slug = $1",
    [slug]
  );
  const r = rows[0];
  return { agreementId: r?.abonnement_agreement_id ?? null, status: r?.abonnement_status ?? null };
}
