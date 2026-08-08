// Passord-hashing med Node sitt innebygde scrypt (ingen ekstern avhengighet).
// Lagres som "salt:hash". Verifisering er timing-safe.
import crypto from "node:crypto";

export function hashPassord(passord: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(passord, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifiserPassord(passord: string, lagret: string | null): boolean {
  if (!lagret) return false;
  const [salt, hash] = lagret.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(passord, salt, 64);
  const forventet = Buffer.from(hash, "hex");
  return test.length === forventet.length && crypto.timingSafeEqual(test, forventet);
}
