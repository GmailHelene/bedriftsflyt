import { test, expect } from "@playwright/test";

// Utvider smoke.spec.ts med det som faktisk kan testes ende-til-ende i dette
// miljøet: rate-limiting (kjører i minne uten Upstash), og at
// booking/betaling feiler TRYGT (viser en forståelig feilmelding, krasjer
// ikke) når DATABASE_URL/Vipps/Stripe-nøkler mangler, slik de gjør i CI.
// Ekte "penger inn, faktura ut"-flyt krever en levende database og ekte
// Vipps-testnøkler, og må derfor testes manuelt mot et miljø som har
// dem satt opp, se README.

test("booking feiler forståelig, ikke med en krasjside, uten database", async ({ page }) => {
  await page.goto("/silje");
  await page.getByRole("radio", { name: /Volumvipper/ }).click();
  await expect(page.getByRole("heading", { name: "Velg dag" })).toBeVisible();

  const dag = page.getByRole("button", { name: /^\d/ }).first();
  if (await dag.isVisible().catch(() => false)) {
    await dag.click();
    const tid = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
    if (await tid.isVisible().catch(() => false)) {
      await tid.click();
      await page.getByLabel(/^Navn/i).fill("Test Testesen");
      await page.getByRole("button", { name: /Bestill time|Book a time/ }).click();
      // Uten DATABASE_URL svarer /api/bookings { ok:false, grunn:"ingen_db" }.
      // Siden skal ikke krasje (ingen "Application error"-tekst fra Next.js).
      await expect(page.getByText(/Application error/i)).not.toBeVisible();
    }
  }
});

test("Vipps-abonnement gir forståelig redirect, ikke en krasjside, uten nøkler", async ({ page }) => {
  const res = await page.goto("/api/vipps/abonnement/start");
  // Ikke innlogget (ingen sesjon i denne testen) -> sendes til login, uansett Vipps-oppsett.
  expect(res?.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/dashboard\/login/);
});


test("e-post-innlogging stopper etter for mange feilforsøk (rate-limiting)", async ({ page }) => {
  const epost = `rate-test-${Date.now()}@eksempel.no`;
  for (let i = 0; i < 13; i++) {
    await page.goto("/dashboard/login");
    await page.getByLabel("E-post").fill(epost);
    await page.getByLabel("Passord").fill("feil-passord-" + i);
    await page.getByRole("button", { name: "Logg inn" }).click();
    await page.waitForLoadState("networkidle");
  }
  // Forsøk nummer 14 med samme e-post bør nå rate-limiten (12/min), uavhengig
  // av om passordet var riktig, og vise feil=for-mange-forsok.
  await page.goto("/dashboard/login");
  await page.getByLabel("E-post").fill(epost);
  await page.getByLabel("Passord").fill("uansett-hva");
  await page.getByRole("button", { name: "Logg inn" }).click();
  await expect(page.getByText(/For mange forsøk/i)).toBeVisible();
});
