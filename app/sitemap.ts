import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  // Offentlige bedriftsprofiler legges til her når katalogen finnes (fase 2).
  return [{ url: base, lastModified: new Date() }];
}
