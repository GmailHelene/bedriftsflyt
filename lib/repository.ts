// Data-lag: bruker Postgres hvis DATABASE_URL er satt, ellers mock-data.
// Slik er appen kjørbar både med og uten database (M1→M2-overgang).
import { getPool, query } from "./db";
import { getBedrift as getMockBedrift, type Bedrift, type Tjeneste, type Tema } from "./mockData";
import { leggTilDager, mandagFor, idagOslo } from "./dato";

type BusinessRow = {
  id: string;
  slug: string;
  navn: string;
  tagline: string | null;
  sted: string | null;
  rating: string;
  antall_vurderinger: number;
  ledige_tider: string[] | null;
  apningstid_fra: string | null;
  apningstid_til: string | null;
  apnings_dager: number[] | null;
  anmeldelse_url: string | null;
  depositum_kr: number | null;
  owner_vipps_sub: string | null;
  tema: Tema | null;
  varsel_epost: string | null;
  profilbilde: string | null;
  galleri: string[] | null;
  merkefarge: string | null;
  org_nr: string | null;
  mva_registrert: boolean | null;
  betalingsinfo: string | null;
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
    `select id, slug, navn, tagline, sted, rating, antall_vurderinger, ledige_tider,
            apningstid_fra, apningstid_til, apnings_dager, anmeldelse_url, depositum_kr, owner_vipps_sub, tema, varsel_epost,
            profilbilde, galleri, merkefarge, org_nr, mva_registrert, betalingsinfo
       from businesses where slug = $1 limit 1`,
    [slug]
  );
  const b = rows[0];
  if (!b) return getMockBedrift(slug); // eksempelprofiler (silje, modum-bygg) virker selv med DB tilkoblet

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
    // «Verifisert» = faktisk koblet til en Vipps-verifisert (BankID) eier.
    verifisert: b.owner_vipps_sub != null,
    rating: Number(b.rating),
    antallVurderinger: b.antall_vurderinger,
    tjenester: services.map(
      (s): Tjeneste => ({ id: s.id, navn: s.navn, prisKr: s.pris_kr, varighetMin: s.varighet_min })
    ),
    ledigeTider: b.ledige_tider ?? [],
    apningstider: {
      fra: b.apningstid_fra ?? "09:00",
      til: b.apningstid_til ?? "17:00",
      dager: b.apnings_dager ?? [1, 2, 3, 4, 5, 6],
    },
    anmeldelseUrl: b.anmeldelse_url ?? undefined,
    depositumKr: b.depositum_kr ?? 0,
    tema: b.tema ?? undefined,
    varselEpost: b.varsel_epost ?? undefined,
    profilbilde: b.profilbilde ?? undefined,
    galleri: b.galleri ?? [],
    merkefarge: b.merkefarge ?? undefined,
    orgNr: b.org_nr ?? undefined,
    mvaRegistrert: b.mva_registrert ?? false,
    betalingsinfo: b.betalingsinfo ?? undefined,
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
// Åpningstidene (fra/til/dager) hentes per bedrift, så booking-kalenderen matcher det
// bedriften faktisk har satt (samme kilde som chatboten bruker). dow: 0=søn..6=lør.
const LEDIGE_TIDER_SQL = `
  select to_char(g, 'HH24:MI') as tid
  from generate_series($1::date + $4::time, $1::date + $5::time, interval '30 min') as g
  where extract(dow from g) = any($6::int[])                        -- kun åpne dager
    and (g + make_interval(mins => $3::int)) <= ($1::date + $5::time)
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
  const biz = await query<{ id: string; apningstid_fra: string | null; apningstid_til: string | null; apnings_dager: number[] | null }>(
    "select id, apningstid_fra, apningstid_til, apnings_dager from businesses where slug = $1",
    [slug]
  );
  if (!biz[0]) return [];
  const svc = await query<{ varighet_min: number }>(
    "select varighet_min from services where business_id = $1 and id = $2 and aktiv = true",
    [biz[0].id, serviceId]
  );
  if (!svc[0]) return [];
  const rows = await query<{ tid: string }>(LEDIGE_TIDER_SQL, [
    dato,
    biz[0].id,
    svc[0].varighet_min,
    biz[0].apningstid_fra ?? "09:00",
    biz[0].apningstid_til ?? "17:00",
    biz[0].apnings_dager ?? [1, 2, 3, 4, 5, 6],
  ]);
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
  | { ok: true; id: string }
  | { ok: false; grunn: "ingen_db" | "ugyldig" | "opptatt" | "stengt" };

function tilMinutter(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

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
    const biz = await client.query(
      "select id, apningstid_fra, apningstid_til, apnings_dager from businesses where slug = $1",
      [input.slug]
    );
    if (!biz.rows[0]) return { ok: false, grunn: "ugyldig" };
    const businessId = biz.rows[0].id as string;
    const fra = (biz.rows[0].apningstid_fra as string) ?? "09:00";
    const til = (biz.rows[0].apningstid_til as string) ?? "17:00";
    const dager = (biz.rows[0].apnings_dager as number[]) ?? [1, 2, 3, 4, 5, 6];

    const svc = await client.query(
      "select varighet_min from services where business_id = $1 and id = $2 and aktiv = true",
      [businessId, input.serviceId]
    );
    if (!svc.rows[0]) return { ok: false, grunn: "ugyldig" };
    const varighet = svc.rows[0].varighet_min as number;

    // Server-side sjekk: tiden må være innenfor åpningstidene (frontenden viser bare gyldige tider,
    // men et direkte API-kall kan prøve seg utenom).
    const [yy, mm, dd] = input.dato.split("-").map(Number);
    const dow = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay();
    const start = tilMinutter(input.tid);
    if (!dager.includes(dow) || start < tilMinutter(fra) || start + varighet > tilMinutter(til)) {
      return { ok: false, grunn: "stengt" };
    }

    const lokal = `${input.dato} ${input.tid}`; // naiv Oslo-lokal tid

    await client.query("begin");
    const cust = await client.query(
      "insert into customers (business_id, navn, telefon, epost) values ($1, $2, $3, $4) returning id",
      [businessId, input.navn, input.telefon ?? null, input.epost ?? null]
    );
    const bk = await client.query(
      `insert into bookings (business_id, service_id, customer_id, starttid, sluttid, tidsrom)
       values (
         $1, $2, $3,
         ($4::timestamp at time zone 'Europe/Oslo'),
         (($4::timestamp + make_interval(mins => $5::int)) at time zone 'Europe/Oslo'),
         tstzrange(
           ($4::timestamp at time zone 'Europe/Oslo'),
           (($4::timestamp + make_interval(mins => $5::int)) at time zone 'Europe/Oslo')
         )
       ) returning id`,
      [businessId, input.serviceId, cust.rows[0].id, lokal, varighet]
    );
    await client.query("commit");
    return { ok: true, id: bk.rows[0].id as string };
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

// ---- Avbestilling ----

export type AvbestillingInfo = {
  id: string;
  slug: string;
  bedriftNavn: string;
  tjeneste: string | null;
  naar: string; // "DD.MM.YYYY HH:MM" (Oslo)
  status: string;
  fortid: boolean;
};

export async function hentBookingForAvbestilling(id: string): Promise<AvbestillingInfo | null> {
  if (!getPool()) return null;
  const rows = await query<{
    id: string;
    slug: string;
    bedrift_navn: string;
    tjeneste: string | null;
    naar: string;
    status: string;
    fortid: boolean;
  }>(
    `select bk.id,
            b.slug,
            b.navn as bedrift_navn,
            s.navn as tjeneste,
            to_char(bk.starttid at time zone 'Europe/Oslo', 'DD.MM.YYYY HH24:MI') as naar,
            bk.status,
            (bk.starttid < now()) as fortid
       from bookings bk
       join businesses b on b.id = bk.business_id
       left join services s on s.business_id = bk.business_id and s.id = bk.service_id
      where bk.id = $1
      limit 1`,
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    bedriftNavn: r.bedrift_navn,
    tjeneste: r.tjeneste,
    naar: r.naar,
    status: r.status,
    fortid: r.fortid,
  };
}

// Kunde avbestiller via signert lenke. Kun fremtidige, ikke-kansellerte timer.
export async function kansellerBooking(id: string): Promise<boolean> {
  if (!getPool()) return false;
  const rows = await query<{ id: string }>(
    "update bookings set status = 'kansellert' where id = $1 and status <> 'kansellert' and starttid > now() returning id",
    [id]
  );
  return rows.length > 0;
}

// Bedriften avbestiller fra dashbordet (kun egne bookinger).
export async function kansellerBookingForBedrift(slug: string, id: string): Promise<boolean> {
  if (!getPool()) return false;
  const rows = await query<{ id: string }>(
    `update bookings set status = 'kansellert'
       from businesses b
      where bookings.id = $2 and bookings.business_id = b.id and b.slug = $1
        and bookings.status <> 'kansellert'
      returning bookings.id`,
    [slug, id]
  );
  return rows.length > 0;
}

// ---- Innstillinger (åpningstider, anmeldelseslenke, depositum) ----

export async function settApningstider(
  slug: string,
  data: { fra: string; til: string; dager: number[] }
): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    "update businesses set apningstid_fra = $2, apningstid_til = $3, apnings_dager = $4 where slug = $1",
    [slug, data.fra, data.til, data.dager]
  );
  return true;
}

export async function settAnmeldelseUrl(slug: string, url: string): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set anmeldelse_url = $2 where slug = $1", [slug, url || null]);
  return true;
}

export async function settDepositum(slug: string, kr: number): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set depositum_kr = $2 where slug = $1", [slug, Math.max(0, Math.round(kr))]);
  return true;
}

export async function settVarselEpost(slug: string, epost: string): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set varsel_epost = $2 where slug = $1", [slug, epost || null]);
  return true;
}

// ---- Utseende: profilbilde, galleri, merkefarge ----

export async function settProfilbilde(slug: string, dataUri: string | null): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set profilbilde = $2 where slug = $1", [slug, dataUri]);
  return true;
}

export async function leggTilGalleribilde(slug: string, dataUri: string): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    `update businesses set galleri =
       case when jsonb_array_length(coalesce(galleri, '[]'::jsonb)) >= 8 then galleri
            else coalesce(galleri, '[]'::jsonb) || to_jsonb($2::text) end
     where slug = $1`,
    [slug, dataUri]
  );
  return true;
}

export async function slettGalleribilde(slug: string, indeks: number): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set galleri = coalesce(galleri, '[]'::jsonb) - $2::int where slug = $1", [slug, indeks]);
  return true;
}

export async function settMerkefarge(slug: string, hex: string | null): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set merkefarge = $2 where slug = $1", [slug, hex]);
  return true;
}

// ---- Chat-logg (så bedriften kan se hva kundene spurte om) ----

export async function lagreChatMelding(slug: string, rolle: "user" | "assistant", tekst: string): Promise<void> {
  if (!getPool()) return;
  await query(
    `insert into chat_messages (business_id, rolle, tekst)
       select b.id, $2, $3 from businesses b where b.slug = $1`,
    [slug, rolle, tekst.slice(0, 4000)]
  );
}

// Returnerer bedriftens varsel-e-post KUN hvis den ikke er varslet siste 6 timer (throttling).
// Atomisk: setter siste_chat_varsel = now() samtidig, så vi ikke spammer.
export async function varsleChatOmMulig(slug: string): Promise<string | null> {
  if (!getPool()) return null;
  const rows = await query<{ varsel_epost: string }>(
    `update businesses set siste_chat_varsel = now()
      where slug = $1 and varsel_epost is not null
        and (siste_chat_varsel is null or siste_chat_varsel < now() - interval '6 hours')
      returning varsel_epost`,
    [slug]
  );
  return rows[0]?.varsel_epost ?? null;
}

export type ChatLogg = { rolle: string; tekst: string; naar: string };

export async function hentSamtaler(slug: string, grense = 100): Promise<ChatLogg[]> {
  if (!getPool()) return [];
  const rows = await query<ChatLogg>(
    `select cm.rolle, cm.tekst,
            to_char(cm.created_at at time zone 'Europe/Oslo', 'DD.MM HH24:MI') as naar
       from chat_messages cm
       join businesses b on b.id = cm.business_id
      where b.slug = $1
      order by cm.created_at desc
      limit $2`,
    [slug, grense]
  );
  return rows;
}

// ---- Påminnelser ----

export type Paminnelse = {
  id: string;
  slug: string;
  bedriftNavn: string;
  tjeneste: string | null;
  epost: string | null;
  navn: string | null;
  naar: string; // "DD.MM.YYYY HH:MM" (Oslo)
};

// Bookinger som starter innen 26 timer og ikke har fått påminnelse ennå.
// Kjøres daglig av en cron → hver booking får én påminnelse ~dagen før.
export async function hentBookingerForPaminnelse(): Promise<Paminnelse[]> {
  if (!getPool()) return [];
  return query<Paminnelse>(
    `select bk.id,
            b.slug,
            b.navn as "bedriftNavn",
            s.navn as tjeneste,
            c.epost,
            c.navn,
            to_char(bk.starttid at time zone 'Europe/Oslo', 'DD.MM.YYYY HH24:MI') as naar
       from bookings bk
       join businesses b on b.id = bk.business_id
       left join services s on s.business_id = bk.business_id and s.id = bk.service_id
       left join customers c on c.id = bk.customer_id
      where bk.status <> 'kansellert'
        and coalesce(bk.paminnelse_sendt, false) = false
        and bk.starttid > now()
        and bk.starttid <= now() + interval '26 hours'
      order by bk.starttid`
  );
}

export async function markerPaminnelseSendt(ids: string[]): Promise<void> {
  if (!getPool() || ids.length === 0) return;
  await query("update bookings set paminnelse_sendt = true where id = any($1::uuid[])", [ids]);
}

// Bedrifter med prøveperiode som går ut innen 3 dager, uten aktivt abonnement, som ikke er varslet.
export type TrialVarsel = { slug: string; epost: string; navn: string; dagerIgjen: number };
export async function hentTrialSluttSnart(): Promise<TrialVarsel[]> {
  if (!getPool()) return [];
  return query<TrialVarsel>(
    `select slug, epost, navn,
            ceil(extract(epoch from ((created_at + interval '14 days') - now())) / 86400)::int as "dagerIgjen"
       from businesses
      where epost is not null
        and coalesce(trial_paminnelse_sendt, false) = false
        and coalesce(abonnement_status, '') not in ('active', 'trialing', 'past_due')
        and (created_at + interval '14 days') between now() and now() + interval '3 days'`
  );
}

export async function markerTrialPaminnelseSendt(slugs: string[]): Promise<void> {
  if (!getPool() || slugs.length === 0) return;
  await query("update businesses set trial_paminnelse_sendt = true where slug = any($1::text[])", [slugs]);
}

// ---- GDPR: dataminimering ----
// Anonymiserer kundedata eldre enn 12 mnd og sletter gamle chat-logger.
// Fakturaer røres IKKE (bokføringsloven krever 5 års oppbevaring).
export async function kjorOpprydding(): Promise<{ kunder: number; meldinger: number }> {
  if (!getPool()) return { kunder: 0, meldinger: 0 };
  const k = await query<{ n: string }>(
    `with oppdatert as (
       update customers set navn = 'Slettet kunde', telefon = null, epost = null, notat = null
        where created_at < now() - interval '12 months' and navn <> 'Slettet kunde'
       returning 1
     ) select count(*)::text as n from oppdatert`
  );
  const m = await query<{ n: string }>(
    `with slettet as (
       delete from chat_messages where created_at < now() - interval '12 months' returning 1
     ) select count(*)::text as n from slettet`
  );
  return { kunder: Number(k[0]?.n ?? 0), meldinger: Number(m[0]?.n ?? 0) };
}

// ---- Faktura + skatt-avsetning (Milepæl 4) ----

export type DashFaktura = {
  id: string;
  fakturaNr: number | null;
  naar: string;
  beskrivelse: string;
  kjoper: string | null;
  sumKr: number;
  status: string;
  skattAvsattKr: number;
  reference: string;
};

// Oppretter faktura med fortløpende nummer (per bedrift), mva hvis bedriften er mva-registrert,
// og 14 dagers forfall. Transaksjon + FOR UPDATE hindrer at to fakturaer får samme nummer.
export async function opprettFaktura(
  slug: string,
  data: { beskrivelse: string; belopKr: number; kjoperNavn?: string }
): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const client = await pool.connect();
  try {
    await client.query("begin");
    const biz = await client.query(
      "select id, mva_registrert, neste_fakturanr from businesses where slug = $1 for update",
      [slug]
    );
    if (!biz.rows[0]) {
      await client.query("rollback");
      return false;
    }
    const bid = biz.rows[0].id as string;
    const mvaReg = biz.rows[0].mva_registrert as boolean;
    const nr = biz.rows[0].neste_fakturanr as number;

    const nettoOre = Math.round(data.belopKr * 100);
    const mvaOre = mvaReg ? Math.round(nettoOre * 0.25) : 0;
    const sumOre = nettoOre + mvaOre;
    const linjer = JSON.stringify([{ navn: data.beskrivelse, kr: data.belopKr }]);

    await client.query(
      `insert into invoices (business_id, linjer, sum_ore, mva_ore, status, vipps_ref, faktura_nr, forfall_dato, kjoper_navn)
       values ($1, $2::jsonb, $3, $4, 'opprettet', 'bf-' || replace(gen_random_uuid()::text, '-', ''), $5,
               (now() at time zone 'Europe/Oslo')::date + 14, $6)`,
      [bid, linjer, sumOre, mvaOre, nr, data.kjoperNavn || null]
    );
    await client.query("update businesses set neste_fakturanr = $2 where id = $1", [bid, nr + 1]);
    await client.query("commit");
    return true;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function settFakturaOpplysninger(
  slug: string,
  data: { orgNr: string; mvaRegistrert: boolean; betalingsinfo: string }
): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    "update businesses set org_nr = $2, mva_registrert = $3, betalingsinfo = $4 where slug = $1",
    [slug, data.orgNr || null, data.mvaRegistrert, data.betalingsinfo || null]
  );
  return true;
}

export type FakturaDetalj = {
  id: string;
  fakturaNr: number | null;
  dato: string;
  forfall: string | null;
  beskrivelse: string;
  nettoKr: number;
  mvaKr: number;
  sumKr: number;
  status: string;
  kjoper: string | null;
  reference: string;
  bedriftNavn: string;
  bedriftSted: string;
  orgNr: string | null;
  mvaRegistrert: boolean;
  betalingsinfo: string | null;
};

export async function hentFakturaDetalj(slug: string, id: string): Promise<FakturaDetalj | null> {
  if (!getPool()) return null;
  const rows = await query<{
    id: string;
    faktura_nr: number | null;
    dato: string;
    forfall: string | null;
    beskrivelse: string | null;
    sum_ore: number;
    mva_ore: number;
    status: string;
    kjoper_navn: string | null;
    vipps_ref: string | null;
    bedrift_navn: string;
    bedrift_sted: string | null;
    org_nr: string | null;
    mva_registrert: boolean;
    betalingsinfo: string | null;
  }>(
    `select i.id, i.faktura_nr,
            to_char(i.created_at at time zone 'Europe/Oslo', 'DD.MM.YYYY') as dato,
            to_char(i.forfall_dato, 'DD.MM.YYYY') as forfall,
            (i.linjer->0->>'navn') as beskrivelse, i.sum_ore, i.mva_ore, i.status, i.kjoper_navn, i.vipps_ref,
            b.navn as bedrift_navn, b.sted as bedrift_sted, b.org_nr, b.mva_registrert, b.betalingsinfo
       from invoices i join businesses b on b.id = i.business_id
      where b.slug = $1 and i.id = $2 limit 1`,
    [slug, id]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    fakturaNr: r.faktura_nr,
    dato: r.dato,
    forfall: r.forfall,
    beskrivelse: r.beskrivelse ?? "Faktura",
    nettoKr: (r.sum_ore - r.mva_ore) / 100,
    mvaKr: r.mva_ore / 100,
    sumKr: r.sum_ore / 100,
    status: r.status,
    kjoper: r.kjoper_navn,
    reference: r.vipps_ref ?? "",
    bedriftNavn: r.bedrift_navn,
    bedriftSted: r.bedrift_sted ?? "",
    orgNr: r.org_nr,
    mvaRegistrert: r.mva_registrert,
    betalingsinfo: r.betalingsinfo,
  };
}

export async function hentFakturaer(slug: string): Promise<DashFaktura[]> {
  if (!getPool()) return [];
  const rows = await query<{
    id: string;
    faktura_nr: number | null;
    naar: string;
    beskrivelse: string | null;
    kjoper_navn: string | null;
    sum_ore: number;
    status: string;
    skatt_avsatt_ore: number;
    vipps_ref: string | null;
  }>(
    `select i.id, i.faktura_nr,
            to_char(i.created_at at time zone 'Europe/Oslo', 'DD.MM HH24:MI') as naar,
            (i.linjer->0->>'navn') as beskrivelse, i.kjoper_navn,
            i.sum_ore, i.status, i.skatt_avsatt_ore, i.vipps_ref
       from invoices i join businesses b on b.id = i.business_id
      where b.slug = $1
      order by i.created_at desc limit 50`,
    [slug]
  );
  return rows.map((r) => ({
    id: r.id,
    fakturaNr: r.faktura_nr,
    naar: r.naar,
    beskrivelse: r.beskrivelse ?? "Faktura",
    kjoper: r.kjoper_navn,
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
      "select business_id, sum_ore, mva_ore, status from invoices where vipps_ref = $1 for update",
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
    // 35 % settes av på nettobeløpet (mva tilhører staten, ikke inntekten).
    const netto = (row.sum_ore as number) - ((row.mva_ore as number) ?? 0);
    const skatt = Math.round(netto * 0.35);
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

// Kobler en Vipps-identitet til en eksisterende (innlogget) bedrift. Avviser hvis Vipps-ID-en
// allerede tilhører en annen bedrift.
export async function koblVippsTilBedrift(slug: string, sub: string): Promise<{ ok: boolean; grunn?: "brukt" }> {
  if (!getPool()) return { ok: false };
  const eksisterende = await query<{ slug: string }>("select slug from businesses where owner_vipps_sub = $1", [sub]);
  if (eksisterende[0] && eksisterende[0].slug !== slug) return { ok: false, grunn: "brukt" };
  await query("update businesses set owner_vipps_sub = $2, verifisert = true where slug = $1", [slug, sub]);
  return { ok: true };
}

// Selvbetjent registrering: en ny bedrift opprettes av en Vipps-verifisert eier.
export async function opprettBedrift(input: {
  navn: string;
  sted: string;
  slug: string;
  ownerSub: string;
}): Promise<{ ok: boolean; grunn?: "opptatt" | "ugyldig" }> {
  if (!getPool()) return { ok: false, grunn: "ugyldig" };
  try {
    const rows = await query<{ slug: string }>(
      `insert into businesses (slug, navn, sted, verifisert, owner_vipps_sub, ledige_tider)
         values ($1, $2, $3, true, $4, array['09:00','12:00','14:00','17:00'])
       on conflict (slug) do nothing
       returning slug`,
      [input.slug, input.navn, input.sted, input.ownerSub]
    );
    return rows.length > 0 ? { ok: true } : { ok: false, grunn: "opptatt" };
  } catch {
    return { ok: false, grunn: "ugyldig" };
  }
}

// ---- E-post/passord-konto ----

export async function opprettBedriftMedPassord(input: {
  navn: string;
  sted: string;
  slug: string;
  epost: string;
  passordHash: string;
}): Promise<{ ok: boolean; grunn?: "slug" | "epost" | "ugyldig" }> {
  if (!getPool()) return { ok: false, grunn: "ugyldig" };
  try {
    const rows = await query<{ slug: string }>(
      `insert into businesses (slug, navn, sted, verifisert, epost, passord_hash, ledige_tider)
         values ($1, $2, $3, false, $4, $5, array['09:00','12:00','14:00','17:00'])
       on conflict (slug) do nothing
       returning slug`,
      [input.slug, input.navn, input.sted, input.epost.toLowerCase(), input.passordHash]
    );
    if (rows.length === 0) return { ok: false, grunn: "slug" };
    return { ok: true };
  } catch (e: unknown) {
    // 23505 = unique_violation → e-posten er allerede i bruk
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23505") {
      return { ok: false, grunn: "epost" };
    }
    return { ok: false, grunn: "ugyldig" };
  }
}

export async function finnBedriftMedEpost(epost: string): Promise<{ slug: string; passordHash: string | null } | null> {
  if (!getPool()) return null;
  const rows = await query<{ slug: string; passord_hash: string | null }>(
    "select slug, passord_hash from businesses where lower(epost) = lower($1) limit 1",
    [epost]
  );
  return rows[0] ? { slug: rows[0].slug, passordHash: rows[0].passord_hash } : null;
}

export async function settPassord(slug: string, hash: string): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set passord_hash = $2 where slug = $1", [slug, hash]);
  return true;
}

// Sett/oppdater innloggings-e-post og/eller passord (så Vipps-brukere også kan bruke e-post+passord).
export async function settLoginOpplysninger(
  slug: string,
  data: { epost?: string; passordHash?: string }
): Promise<{ ok: boolean; grunn?: "epost" }> {
  if (!getPool()) return { ok: false };
  try {
    if (data.epost !== undefined) {
      await query("update businesses set epost = $2 where slug = $1", [slug, data.epost.toLowerCase() || null]);
    }
    if (data.passordHash) {
      await query("update businesses set passord_hash = $2 where slug = $1", [slug, data.passordHash]);
    }
    return { ok: true };
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23505") {
      return { ok: false, grunn: "epost" }; // e-posten er i bruk av en annen konto
    }
    throw e;
  }
}

export async function hentLoginEpost(
  slug: string
): Promise<{ epost: string | null; harPassord: boolean; harVipps: boolean } | null> {
  if (!getPool()) return null;
  const rows = await query<{ epost: string | null; passord_hash: string | null; owner_vipps_sub: string | null }>(
    "select epost, passord_hash, owner_vipps_sub from businesses where slug = $1",
    [slug]
  );
  const r = rows[0];
  return r ? { epost: r.epost, harPassord: Boolean(r.passord_hash), harVipps: Boolean(r.owner_vipps_sub) } : null;
}

// ---- Booking-kalender (ukesvisning) ----

export type KalenderBooking = {
  id: string;
  dato: string; // YYYY-MM-DD (Oslo)
  tid: string; // HH:MM
  tjeneste: string | null;
  kunde: string | null;
};

// Henter bookinger for uka som inneholder `anker` (mandag→søndag), i Oslo-tid.
export async function hentUke(
  slug: string,
  anker?: string
): Promise<{ mandag: string; bookinger: KalenderBooking[] }> {
  const start = mandagFor(anker && /^\d{4}-\d{2}-\d{2}$/.test(anker) ? anker : idagOslo());
  if (!getPool()) return { mandag: start, bookinger: [] };

  const slutt = leggTilDager(start, 6);
  const bookinger = await query<KalenderBooking>(
    `select bk.id,
            (bk.starttid at time zone 'Europe/Oslo')::date::text as dato,
            to_char(bk.starttid at time zone 'Europe/Oslo', 'HH24:MI') as tid,
            s.navn as tjeneste,
            c.navn as kunde
       from bookings bk
       join businesses b on b.id = bk.business_id
       left join services s on s.business_id = bk.business_id and s.id = bk.service_id
       left join customers c on c.id = bk.customer_id
      where b.slug = $1
        and bk.status <> 'kansellert'
        and (bk.starttid at time zone 'Europe/Oslo')::date between $2::date and $3::date
      order by bk.starttid`,
    [slug, start, slutt]
  );
  return { mandag: start, bookinger };
}

// ---- Kundekort ----

export type KundeBooking = { naar: string; tjeneste: string | null };
export type Kunde = {
  navn: string;
  telefon: string | null;
  epost: string | null;
  notat: string | null;
  antall: number;
  siste: string | null;
  bookinger: KundeBooking[];
};

// Kunder opprettes per booking. Vi grupperer på (navn, telefon) slik at en som booker
// flere ganger vises som én kunde med samlet historikk.
export async function hentKunder(slug: string): Promise<Kunde[]> {
  if (!getPool()) return [];
  const rows = await query<{
    navn: string;
    telefon: string | null;
    epost: string | null;
    notat: string | null;
    antall: string;
    siste: string | null;
    bookinger: KundeBooking[];
  }>(
    `select c.navn,
            c.telefon,
            max(c.epost) as epost,
            max(c.notat) as notat,
            count(bk.id) as antall,
            to_char(max(bk.starttid) at time zone 'Europe/Oslo', 'DD.MM.YYYY') as siste,
            coalesce(
              json_agg(
                json_build_object(
                  'naar', to_char(bk.starttid at time zone 'Europe/Oslo', 'DD.MM.YYYY HH24:MI'),
                  'tjeneste', s.navn
                ) order by bk.starttid desc
              ) filter (where bk.id is not null),
              '[]'
            ) as bookinger
       from customers c
       join businesses b on b.id = c.business_id
       left join bookings bk on bk.customer_id = c.id and bk.status <> 'kansellert'
       left join services s on s.business_id = c.business_id and s.id = bk.service_id
      where b.slug = $1
      group by c.navn, c.telefon
      order by max(bk.starttid) desc nulls last, c.navn
      limit 200`,
    [slug]
  );
  return rows.map((r) => ({
    navn: r.navn,
    telefon: r.telefon,
    epost: r.epost,
    notat: r.notat,
    antall: Number(r.antall),
    siste: r.siste,
    bookinger: r.bookinger ?? [],
  }));
}

export async function oppdaterKundeNotat(
  slug: string,
  navn: string,
  telefon: string | null,
  notat: string
): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    `update customers set notat = $4
       from businesses b
      where customers.business_id = b.id
        and b.slug = $1
        and customers.navn = $2
        and coalesce(customers.telefon, '') = coalesce($3, '')`,
    [slug, navn, telefon, notat]
  );
  return true;
}

// ---- KI-chatbot oppsett ----

export type ChatbotConfig = {
  apningstider?: string;
  adressePolicy?: string;
  avbestilling?: string;
  tone?: string;
  faq?: string;
};

export async function hentChatbotConfig(slug: string): Promise<ChatbotConfig> {
  if (!getPool()) return {};
  const rows = await query<{ chatbot_config: ChatbotConfig | null }>(
    "select chatbot_config from businesses where slug = $1",
    [slug]
  );
  return rows[0]?.chatbot_config ?? {};
}

export async function settChatbotConfig(slug: string, config: ChatbotConfig): Promise<boolean> {
  if (!getPool()) return false;
  await query("update businesses set chatbot_config = $2::jsonb where slug = $1", [
    slug,
    JSON.stringify(config),
  ]);
  return true;
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

// ---- Stripe-abonnement ----

export async function settStripeAbonnement(
  slug: string,
  data: { customerId?: string | null; subscriptionId?: string | null; status: string }
): Promise<boolean> {
  if (!getPool()) return false;
  await query(
    `update businesses set
       stripe_customer_id = coalesce($2, stripe_customer_id),
       stripe_subscription_id = coalesce($3, stripe_subscription_id),
       abonnement_status = $4
     where slug = $1`,
    [slug, data.customerId ?? null, data.subscriptionId ?? null, data.status]
  );
  return true;
}

// Oppdaterer status ut fra Stripe-webhook (slår opp på subscription-id).
export async function oppdaterAbonnementForSub(subscriptionId: string, status: string): Promise<boolean> {
  if (!getPool()) return false;
  const rows = await query<{ slug: string }>(
    "update businesses set abonnement_status = $2 where stripe_subscription_id = $1 returning slug",
    [subscriptionId, status]
  );
  return rows.length > 0;
}

// Kortfri prøveperiode: 14 dager fra registrering (regnes fra created_at).
export async function hentProveperiode(
  slug: string
): Promise<{ dagerIgjen: number; utlopt: boolean; status: string | null }> {
  if (!getPool()) return { dagerIgjen: 14, utlopt: false, status: null };
  const rows = await query<{ dager: number; status: string | null }>(
    `select ceil(extract(epoch from ((created_at + interval '14 days') - now())) / 86400)::int as dager,
            abonnement_status as status
       from businesses where slug = $1`,
    [slug]
  );
  const r = rows[0];
  const dager = r ? Math.max(0, Number(r.dager)) : 0;
  return { dagerIgjen: dager, utlopt: dager <= 0, status: r?.status ?? null };
}

export async function hentStripeKunde(slug: string): Promise<string | null> {
  if (!getPool()) return null;
  const rows = await query<{ stripe_customer_id: string | null }>(
    "select stripe_customer_id from businesses where slug = $1",
    [slug]
  );
  return rows[0]?.stripe_customer_id ?? null;
}
