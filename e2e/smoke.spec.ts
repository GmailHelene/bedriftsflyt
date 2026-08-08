import { test, expect } from "@playwright/test";

// Røyktest av kjerne-UI. Kjører uten database (bruker mock-data for visning).
// Full booking→faktura-flyt krever DATABASE_URL — se README.

test("offentlig profil viser bedrift og tjenester", async ({ page }) => {
  await page.goto("/silje");
  await expect(page.getByRole("heading", { name: /Silje/ })).toBeVisible();
  await expect(page.getByText(/Volumvipper/)).toBeVisible();
});

test("velg behandling avslører dag-valg", async ({ page }) => {
  await page.goto("/silje");
  await page.getByRole("radio", { name: /Volumvipper/ }).click();
  await expect(page.getByRole("heading", { name: "Velg dag" })).toBeVisible();
});

test("chat-knappen finnes på profilen", async ({ page }) => {
  await page.goto("/silje");
  await expect(page.getByRole("button", { name: /Spør oss/ })).toBeVisible();
});

test("innloggingssiden tilbyr Vipps og dev", async ({ page }) => {
  await page.goto("/dashboard/login");
  await expect(page.getByRole("link", { name: /Logg inn med Vipps/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Logg inn \(dev\)/ })).toBeVisible();
});
