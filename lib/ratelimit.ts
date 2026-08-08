// Rate-limiting med hardt tak via Upstash Redis når konfigurert,
// ellers best-effort in-memory (per server-instans). Setter man UPSTASH-nøkler
// får man et ekte, delt tak på tvers av instanser (mot «Denial of Wallet»).
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null = null;
let forsokt = false;

function getLimiter(): Ratelimit | null {
  if (forsokt) return limiter;
  forsokt = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(12, "1 m"), // 12 per minutt
    prefix: "bf",
  });
  return limiter;
}

// In-memory fallback
const bucket = new Map<string, { count: number; resetAt: number }>();
function fallbackLimited(id: string, limit = 12, windowMs = 60_000): boolean {
  const now = Date.now();
  const e = bucket.get(id);
  if (!e || now > e.resetAt) {
    bucket.set(id, { count: 1, resetAt: now + windowMs });
    return false;
  }
  e.count += 1;
  return e.count > limit;
}

export async function erRateLimited(id: string): Promise<boolean> {
  const l = getLimiter();
  if (l) {
    const { success } = await l.limit(id);
    return !success;
  }
  return fallbackLimited(id);
}
