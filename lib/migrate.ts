// Idempotent auto-migrering + seed. Kjøres ved server-oppstart (instrumentation.ts) så live-databasen
// får nye kolonner og demo-data uten manuelle steg. Alt er "if not exists" / "on conflict do nothing".
import { getPool, query } from "./db";

let kjort = false;

const ALTERS = [
  // Base-hardening (speiler schema.sql) - sikrer at live-DB har ALT, ikke bare det db:setup la inn.
  "create extension if not exists btree_gist",
  "alter table bookings add column if not exists sluttid timestamptz",
  "alter table bookings add column if not exists tidsrom tstzrange",
  "alter table businesses add column if not exists owner_vipps_sub text",
  "create unique index if not exists uniq_owner_vipps_sub on businesses(owner_vipps_sub) where owner_vipps_sub is not null",
  "alter table businesses add column if not exists abonnement_agreement_id text",
  "alter table businesses add column if not exists abonnement_status text",
  `do $$ begin
     if not exists (select 1 from pg_constraint where conname = 'no_overlapping_bookings') then
       alter table bookings add constraint no_overlapping_bookings
         exclude using gist (business_id with =, tidsrom with &&) where (status <> 'kansellert');
     end if;
   end $$`,
  // Åpningstider per bedrift (styrer booking-kalender + chatbot). dow: 0=søn..6=lør.
  "alter table businesses add column if not exists apningstid_fra text not null default '09:00'",
  "alter table businesses add column if not exists apningstid_til text not null default '17:00'",
  "alter table businesses add column if not exists apnings_dager int[] not null default '{1,2,3,4,5,6}'",
  // Google-/anmeldelseslenke og valgfritt depositum ved booking.
  "alter table businesses add column if not exists anmeldelse_url text",
  "alter table businesses add column if not exists depositum_kr int not null default 0",
  // Bransjetema (så demo-profiler beholder fargene sine i databasen).
  "alter table businesses add column if not exists tema jsonb",
  // Påminnelser: marker at en booking allerede har fått påminnelse.
  "alter table bookings add column if not exists paminnelse_sendt boolean not null default false",
  // Eier-varsling: e-postadresse bedriften vil ha ny-booking-varsler til.
  "alter table businesses add column if not exists varsel_epost text",
  // E-post/passord-innlogging (alternativ til Vipps).
  "alter table businesses add column if not exists epost text",
  "alter table businesses add column if not exists passord_hash text",
  "create unique index if not exists uniq_business_epost on businesses (lower(epost)) where epost is not null",
];

// Demo-bedrifter så eksempelsidene er ekte bookbare (book → e-post → avbestill).
// owner_vipps_sub-sentinel gir «verifisert»-badge. on conflict do nothing = trygt å kjøre på nytt.
const SEED = [
  `insert into businesses (slug, navn, tagline, sted, verifisert, rating, antall_vurderinger, owner_vipps_sub, apningstid_fra, apningstid_til, apnings_dager)
     values ('silje','Silje · Vipper & Bryn','Hjemmestudio · svarer vanligvis innen 1 t','Hamar', true, 4.9, 87, 'demo-silje','09:00','17:00','{1,2,3,4,5,6}')
   on conflict (slug) do nothing`,
  `insert into businesses (slug, navn, tagline, sted, verifisert, rating, antall_vurderinger, owner_vipps_sub, apningstid_fra, apningstid_til, apnings_dager, tema)
     values ('modum-bygg','Modum Bygg & Montering','Snekker og montering · fast pris på befaring','Modum', true, 4.8, 41, 'demo-modum','08:00','16:00','{1,2,3,4,5}', '{"accent":"#1f5f8b","coverFra":"#4a90c2","coverTil":"#1c4a6b"}'::jsonb)
   on conflict (slug) do nothing`,
  // Tjenester (silje)
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'klassisk', b.id, 'Klassiske vipper – nytt sett', 900, 90 from businesses b where b.slug='silje' on conflict (business_id, id) do nothing`,
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'volum', b.id, 'Volumvipper – nytt sett', 1200, 120 from businesses b where b.slug='silje' on conflict (business_id, id) do nothing`,
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'pafyll', b.id, 'Påfyll vipper', 650, 60 from businesses b where b.slug='silje' on conflict (business_id, id) do nothing`,
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'bryn', b.id, 'Brynsløft', 750, 60 from businesses b where b.slug='silje' on conflict (business_id, id) do nothing`,
  // Tjenester (modum-bygg)
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'befaring', b.id, 'Befaring og pristilbud', 0, 45 from businesses b where b.slug='modum-bygg' on conflict (business_id, id) do nothing`,
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'timepris', b.id, 'Snekkerarbeid – timepris', 750, 60 from businesses b where b.slug='modum-bygg' on conflict (business_id, id) do nothing`,
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'kjokken', b.id, 'Montering av kjøkken', 8500, 480 from businesses b where b.slug='modum-bygg' on conflict (business_id, id) do nothing`,
  `insert into services (id, business_id, navn, pris_kr, varighet_min) select 'listverk', b.id, 'Listverk og innerdører', 2500, 180 from businesses b where b.slug='modum-bygg' on conflict (business_id, id) do nothing`,
];

export type MigreringSteg = { sql: string; ok: boolean; feil?: string };

async function kjorAlle(): Promise<MigreringSteg[]> {
  const resultater: MigreringSteg[] = [];
  for (const sql of [...ALTERS, ...SEED]) {
    try {
      await query(sql);
      resultater.push({ sql: sql.slice(0, 70), ok: true });
    } catch (e) {
      const feil = e instanceof Error ? e.message : String(e);
      console.error("[migrate] feilet:", feil);
      resultater.push({ sql: sql.slice(0, 70), ok: false, feil });
    }
  }
  return resultater;
}

export async function migrer(): Promise<void> {
  if (kjort || !getPool()) return;
  kjort = true;
  await kjorAlle();
}

// Tvangs-kjør migreringen og returner en rapport (brukes av /api/migrer for diagnose + fiks).
export async function migrerMedRapport(): Promise<MigreringSteg[]> {
  if (!getPool()) return [{ sql: "getPool", ok: false, feil: "DATABASE_URL ikke satt" }];
  return kjorAlle();
}
