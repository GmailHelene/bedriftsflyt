const erUtvikling = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Bygget etter hva appen faktisk laster i nettleseren:
// - Egne script og JSON-LD (LocalBusiness-SEO) er inline, og Next.js legger selv inn
//   inline bootstrap-script for hydrering. Uten en nonce-middleware krever det
//   'unsafe-inline' i script-src. Samme for style-src: hele UI-et bruker inline
//   style-attributter (style={{...}}), som CSP regner som inline stil.
// - GoatCounter: script fra gc.zgo.at, teller-beacon til bedriftsflyt.goatcounter.com.
// - Sentry (klient): sender feil til *.sentry.io.
// - Profil- og galleribilder ligger som base64 data-URI-er → data:/blob: i img-src.
// - Vipps og betaling skjer server-side (303-redirect), ikke som innebygd ressurs;
//   *.vipps.no i form-action dekker en eventuell Vipps-retur.
// I utvikling trenger Next 'unsafe-eval' (HMR) og websocket, derfor de to tilleggene.
const cspDirektiver = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://*.vipps.no",
  "frame-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "img-src 'self' data: blob: https://bedriftsflyt.goatcounter.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline' https://gc.zgo.at${erUtvikling ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self' https://bedriftsflyt.goatcounter.com https://*.sentry.io https://*.ingest.sentry.io${erUtvikling ? " ws:" : ""}`,
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kjører instrumentation.ts (register) → Sentry.init server-side.
  experimental: {
    instrumentationHook: true,
    // Server Actions bak Railways proxy: godta forespørsler fra prod-domenene
    // (uten dette kan Next avvise form-actions når forwarded host != host).
    serverActions: {
      // app.kundebox.no er dagens domene. De to gamle bedriftsflyt.no-oppføringene
      // står igjen som et ufarlig sikkerhetsnett i overgangen, ikke fjernet ennå.
      allowedOrigins: ["app.kundebox.no", "bedriftsflyt.no", "www.bedriftsflyt.no", "bedriftsflyt-production.up.railway.app"],
      bodySizeLimit: "2mb", // rom for komprimerte bilde-opplastinger (base64)
    },
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspDirektiver },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
    ];
  },
};

export default nextConfig;
