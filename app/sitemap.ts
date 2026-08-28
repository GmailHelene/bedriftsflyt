import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const naa = new Date();
  // Offentlige bedriftsprofiler legges til her når katalogen finnes (fase 2).
  return [
    { url: base, lastModified: naa },
    { url: `${base}/vilkar`, lastModified: naa },
    { url: `${base}/personvern`, lastModified: naa },
    { url: `${base}/databehandleravtale`, lastModified: naa },
  ];
}
