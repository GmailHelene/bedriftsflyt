// Idempotent auto-migrering. Kjøres ved server-oppstart (instrumentation.ts) så live-databasen
// får nye kolonner uten manuelle steg. Alt er "add column if not exists" - trygt å kjøre på nytt.
import { getPool, query } from "./db";

let kjort = false;

export async function migrer(): Promise<void> {
  if (kjort || !getPool()) return;
  kjort = true;

  const steg = [
    // Åpningstider per bedrift (styrer både booking-kalender og chatbot). dow: 0=søn..6=lør.
    "alter table businesses add column if not exists apningstid_fra text not null default '09:00'",
    "alter table businesses add column if not exists apningstid_til text not null default '17:00'",
    "alter table businesses add column if not exists apnings_dager int[] not null default '{1,2,3,4,5,6}'",
    // Google-/anmeldelseslenke (ekte vurderinger etter time).
    "alter table businesses add column if not exists anmeldelse_url text",
    // Valgfritt depositum ved booking (aktiveres når Vipps er live).
    "alter table businesses add column if not exists depositum_kr int not null default 0",
  ];

  for (const sql of steg) {
    try {
      await query(sql);
    } catch (e) {
      console.error("[migrate] hoppet over:", e instanceof Error ? e.message : e);
    }
  }
}
