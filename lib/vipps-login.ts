// Vipps Login (OIDC) — verifisert, passordløs innlogging. Server-side.
// Kilde: developer.vippsmobilepay.com/docs/APIs/login-api. Bruker OIDC-discovery for endepunkter.
import { env } from "./env";

const BASE = env.VIPPS_BASE_URL ?? "https://apitest.vipps.no";
const WELL_KNOWN = `${BASE}/access-management-1.0/access/.well-known/openid-configuration`;

type OidcConfig = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
};

let cachedConfig: OidcConfig | null = null;

export function vippsLoginKonfigurert(): boolean {
  return Boolean(env.VIPPS_CLIENT_ID && env.VIPPS_CLIENT_SECRET);
}

export async function hentOidcConfig(): Promise<OidcConfig> {
  if (cachedConfig) return cachedConfig;
  const res = await fetch(WELL_KNOWN);
  if (!res.ok) throw new Error(`Vipps OIDC-discovery feilet: ${res.status}`);
  const d = (await res.json()) as OidcConfig;
  cachedConfig = {
    authorization_endpoint: d.authorization_endpoint,
    token_endpoint: d.token_endpoint,
    userinfo_endpoint: d.userinfo_endpoint,
  };
  return cachedConfig;
}

export async function byggAuthUrl(opts: {
  redirectUri: string;
  state: string;
  nonce: string;
}): Promise<string> {
  const cfg = await hentOidcConfig();
  const p = new URLSearchParams({
    client_id: env.VIPPS_CLIENT_ID ?? "",
    response_type: "code",
    scope: "openid name phoneNumber",
    redirect_uri: opts.redirectUri,
    state: opts.state,
    nonce: opts.nonce,
  });
  return `${cfg.authorization_endpoint}?${p.toString()}`;
}

export async function bytteKode(opts: { code: string; redirectUri: string }): Promise<string> {
  const cfg = await hentOidcConfig();
  const basic = Buffer.from(`${env.VIPPS_CLIENT_ID}:${env.VIPPS_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(cfg.token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`, // client_secret_basic
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: opts.code,
      redirect_uri: opts.redirectUri,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Vipps token-bytte feilet: ${res.status}`);
  const d = (await res.json()) as { access_token: string };
  return d.access_token;
}

export async function hentBruker(accessToken: string): Promise<{ sub: string; navn?: string; telefon?: string }> {
  const cfg = await hentOidcConfig();
  const res = await fetch(cfg.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Vipps userinfo feilet: ${res.status}`);
  const d = (await res.json()) as { sub: string; name?: string; phone_number?: string };
  return { sub: d.sub, navn: d.name, telefon: d.phone_number };
}
