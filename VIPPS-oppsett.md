# Vipps (M4) — status og hvordan fullføre

**Bygget nå (mot testmiljøet, `apitest.vipps.no`):**
- `lib/vipps.ts` — access token, opprett betaling (`/epayment/v1/payments`), hent betaling, og **webhook-signaturvern** (HMAC-SHA256).
- `app/api/vipps/initiate` (POST) — starter en betaling, returnerer `redirectUrl`.
- `app/api/vipps/webhook` (POST) — mottar Vipps-hendelser, **verifiserer signaturen** før noe godtas.

> ⚠️ Dette er en scaffold verifisert til at den *bygger*. Den er IKKE kjørt mot ekte Vipps ennå — det krever nøklene dine. Verifiser detaljene mot Vipps-docs når du tester.

## Slik fullfører du (når du har nøklene)
1. Hent i Vipps-portalen: `client_id`, `client_secret`, `Ocp-Apim-Subscription-Key`, `MSN`. Registrer en webhook og få **webhook-secret**.
2. Legg i `.env.local`: `VIPPS_CLIENT_ID`, `VIPPS_CLIENT_SECRET`, `VIPPS_SUBSCRIPTION_KEY`, `VIPPS_MSN`, `VIPPS_WEBHOOK_SECRET`. La `VIPPS_BASE_URL` stå tom (test) til du går live.
3. Test en betaling:
   ```bash
   curl -X POST http://localhost:3000/api/vipps/initiate \
     -H "content-type: application/json" \
     -d '{"referanse":"test-001","belopKr":650,"beskrivelse":"Test","returUrl":"http://localhost:3000/silje"}'
   ```
   Åpne `redirectUrl` i test-Vipps-appen.
4. For webhook lokalt: eksponer med en tunnel (f.eks. ngrok) og registrer URL-en i Vipps.

## Gjenstår (kobles når fakturaflyt finnes)
- Opprett faktura/`invoices`-rad med `reference` før betaling.
- I webhooken: ved vellykket betaling → marker faktura betalt + **sett av 35 % til `tax_reserve`**.
- Legg til **rate-limiting** på `initiate` (jf. review).
- Vipps Recurring for selve abonnementet (389/mnd) — eget steg.
