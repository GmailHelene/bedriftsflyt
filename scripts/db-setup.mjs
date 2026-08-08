// Kjører db/schema.sql + db/seed.sql mot DATABASE_URL.
// Erstatter Railway-Data-boksen (som ikke takler DDL) og trenger ikke psql.
// Bruk: npm run db:setup   (DATABASE_URL leses fra .env.local)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Les .env.local manuelt (slipper ekstra avhengighet)
try {
  const txt = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // ingen .env.local — bruker eksisterende miljøvariabler
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ Mangler DATABASE_URL. Legg den i .env.local (bruk den PUBLIKE Railway-URL-en).");
  process.exit(1);
}
if (url.includes(".railway.internal")) {
  console.error("✗ Du bruker den INTERNE URL-en (…railway.internal). Den virker ikke fra din PC.");
  console.error("  Bruk DATABASE_PUBLIC_URL fra Railway (vert som …proxy.rlwy.net).");
  process.exit(1);
}

const ssl = process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false };
const client = new pg.Client({ connectionString: url, ssl });

const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");
const seed = readFileSync(join(root, "db", "seed.sql"), "utf8");

try {
  console.log("Kobler til databasen …");
  await client.connect();
  await client.query(schema);
  console.log("✓ Tabeller opprettet (schema.sql)");
  await client.query(seed);
  console.log("✓ Eksempeldata lagt inn (seed.sql)");
  console.log("\nFerdig! Start appen: npm run dev  →  http://localhost:3000/silje");
} catch (e) {
  console.error("✗ Feil:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
