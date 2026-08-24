# Bedriftsflyt (app)

KI-drevet bedrift-i-en-boks for norske solo-/mikrobedrifter. Se dokumentbasen i mappa over (`../Bedriftsflyt - *.md`).

## Kjør lokalt
```bash
npm install
npm run dev
```
Åpne http://localhost:3000 → klikk «Åpne Silje» for den offentlige profil-/booking-visningen.

## Status
- ✅ Next.js-skjelett (App Router + TypeScript)
- ✅ Offentlig profil + booking + `LocalBusiness`-SEO
- ✅ Datamodell (`db/schema.sql`) + data-lag (`lib/repository.ts`) — **leverandør-uavhengig Postgres via `DATABASE_URL`**
- ✅ Innlogging (Vipps) + bedrifts-dashbord
- ✅ Faktura + betaling med Vipps + skatt-avsetning
- ✅ KI-chatbot og KI-teksthjelp

## Database (valgfritt — appen kjører på mock uten den)
Fungerer med **Railway Postgres**, Vercel Postgres, Neon eller Supabase — samme kode.
1. Opprett en Postgres (f.eks. i Railway) og kopier Connection URL til `.env.local` som `DATABASE_URL`.
2. Kjør schema + eksempeldata:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   psql "$DATABASE_URL" -f db/seed.sql
   ```
Uten `DATABASE_URL` faller `lib/repository.ts` tilbake til `lib/mockData.ts`.

## Hosting
Appen kan deployes på **Vercel** *eller* **Railway** (begge greie for Next.js). DB-valget er uavhengig av hosting-valget.

Byggerekkefølge: se `../Bedriftsflyt - MVP-nedbrytning (koding) (2026-08-07).md`.

## Viktige regler
- Hemmeligheter kun i `.env.local` (aldri i repo). Se `.env.example`.
- KI-kall og betaling skjer **kun server-side**.
