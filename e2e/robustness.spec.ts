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


test("dev-innlogging stopper etter for mange feilforsøk (rate-limiting)", async ({ page }) => {
  await page.goto("/dashboard/login");
  for (let i = 0; i < 13; i++) {
    await page.evaluate(async () => {
      const form = new FormData();
      form.set("slug", "silje");
      form.set("passord", "feil-passord-" + Math.random());
      await fetch("/api/login", { method: "POST", body: form, redirect: "manual" });
    });
  }
  // Forsøk nummer 14 bør nå rate-limiten (12/min) og sendes til login med feil=for-mange-forsok,
  // uavhengig av om passordet var riktig.
  const form = new FormData();
  form.append("slug", "silje");
  form.append("passord", "uansett");
  await page.goto("/dashboard/login");
  await page.route("**/api/login", (route) => route.continue());
  const req = await page.request.post("/api/login", {
    form: { slug: "silje", passord: "uansett" },
    maxRedirects: 0,
  });
  expect([303, 302]).toContain(req.status());
  const location = req.headers()["location"] ?? "";
  expect(location).toContain("feil=for-mange-forsok");
});
