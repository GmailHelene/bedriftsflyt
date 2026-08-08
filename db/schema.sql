-- Bedriftsflyt datamodell (Milepæl 2). Standard PostgreSQL.
-- Kjør mot Railway Postgres / Supabase / Neon: psql "$DATABASE_URL" -f db/schema.sql
create extension if not exists pgcrypto;

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  navn text not null,
  tagline text,
  sted text,
  verifisert boolean not null default false,
  rating numeric(2,1) not null default 0,
  antall_vurderinger int not null default 0,
  ledige_tider text[] not null default '{}',
  chatbot_config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists services (
  id text not null,
  business_id uuid not null references businesses(id) on delete cascade,
  navn text not null,
  pris_kr int not null,
  varighet_min int not null,
  aktiv boolean not null default true,
  primary key (business_id, id)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  navn text not null,
  telefon text,
  epost text,
  notat text,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  service_id text not null,
  customer_id uuid references customers(id) on delete set null,
  starttid timestamptz not null,
  status text not null default 'bekreftet',
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  linjer jsonb not null default '[]',
  sum_ore int not null,
  status text not null default 'sendt',
  vipps_ref text,
  skatt_avsatt_ore int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rolle text not null,
  tekst text not null,
  created_at timestamptz not null default now()
);

create table if not exists tax_reserve (
  business_id uuid primary key references businesses(id) on delete cascade,
  avsatt_ore_total bigint not null default 0
);

create index if not exists idx_bookings_business on bookings(business_id, starttid);
create index if not exists idx_customers_business on customers(business_id);
create index if not exists idx_invoices_business on invoices(business_id);

-- Hardening (idempotent — trygt å kjøre på nytt mot eksisterende database).
-- Race-condition-vern: to bookinger kan ikke overlappe i tid for samme bedrift.
create extension if not exists btree_gist;
alter table bookings add column if not exists sluttid timestamptz;
alter table bookings add column if not exists tidsrom tstzrange;
-- Vipps Login: kobler en verifisert Vipps-bruker (sub) til bedriften den eier.
alter table businesses add column if not exists owner_vipps_sub text;
create unique index if not exists uniq_owner_vipps_sub on businesses(owner_vipps_sub) where owner_vipps_sub is not null;
-- Vipps Recurring: abonnementsavtale (389/mnd).
alter table businesses add column if not exists abonnement_agreement_id text;
alter table businesses add column if not exists abonnement_status text;
-- Åpningstider per bedrift (styrer booking-kalender + chatbot). dow: 0=søn..6=lør.
alter table businesses add column if not exists apningstid_fra text not null default '09:00';
alter table businesses add column if not exists apningstid_til text not null default '17:00';
alter table businesses add column if not exists apnings_dager int[] not null default '{1,2,3,4,5,6}';
-- Google-/anmeldelseslenke og valgfritt depositum ved booking.
alter table businesses add column if not exists anmeldelse_url text;
alter table businesses add column if not exists depositum_kr int not null default 0;
-- Bransjetema (demo-profiler beholder fargene sine).
alter table businesses add column if not exists tema jsonb;
-- Påminnelser: marker at en booking har fått påminnelse.
alter table bookings add column if not exists paminnelse_sendt boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'no_overlapping_bookings') then
    alter table bookings
      add constraint no_overlapping_bookings
      exclude using gist (business_id with =, tidsrom with &&)
      where (status <> 'kansellert');
  end if;
end $$;
-- (businesses.slug har allerede unik indeks via UNIQUE-constraint.)
