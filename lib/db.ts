// Leverandør-uavhengig Postgres-tilkobling via DATABASE_URL.
// Virker på Railway Postgres, Vercel Postgres, Neon eller Supabase — samme kode.
import { Pool } from "pg";
import { env } from "./env";

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!env.DATABASE_URL) return null; // uten DB → repository faller tilbake til mock
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      // Railway/Neon/Supabase krever ofte SSL på eksterne tilkoblinger.
      ssl: env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export function harDatabase(): boolean {
  return getPool() !== null;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL er ikke satt");
  const res = await p.query(text, params as never[]);
  return res.rows as T[];
}
