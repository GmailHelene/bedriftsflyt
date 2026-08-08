/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kjører instrumentation.ts (register) → Sentry.init server-side.
  experimental: { instrumentationHook: true },
};

export default nextConfig;
