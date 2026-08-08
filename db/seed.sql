-- Eksempeldata (samme som lib/mockData.ts). Kjør etter schema.sql:
-- psql "$DATABASE_URL" -f db/seed.sql
insert into businesses (slug, navn, tagline, sted, verifisert, rating, antall_vurderinger, ledige_tider)
values ('silje', 'Silje · Vipper & Bryn', 'Hjemmestudio · svarer vanligvis innen 1 t', 'Hamar', true, 4.9, 87,
        array['09:00','12:00','14:00','17:00'])
on conflict (slug) do nothing;

insert into services (id, business_id, navn, pris_kr, varighet_min)
select v.id, b.id, v.navn, v.pris_kr, v.varighet_min
from businesses b
cross join (values
  ('klassisk','Klassiske vipper – nytt sett', 900, 90),
  ('volum','Volumvipper – nytt sett', 1200, 120),
  ('pafyll','Påfyll vipper', 650, 60),
  ('bryn','Brynsløft', 750, 60)
) as v(id, navn, pris_kr, varighet_min)
where b.slug = 'silje'
on conflict (business_id, id) do nothing;
