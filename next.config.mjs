/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kjører instrumentation.ts (register) → Sentry.init server-side.
  experimental: {
    instrumentationHook: true,
    // Server Actions bak Railways proxy: godta forespørsler fra prod-domenene
    // (uten dette kan Next avvise form-actions når forwarded host != host).
    serverActions: {
      allowedOrigins: ["bedriftsflyt.no", "www.bedriftsflyt.no", "bedriftsflyt-production.up.railway.app"],
      bodySizeLimit: "2mb", // rom for komprimerte bilde-opplastinger (base64)
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
