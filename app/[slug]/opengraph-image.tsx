import { ImageResponse } from "next/og";
import { hentBedrift } from "@/lib/repository";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bedriftsflyt-profil";

export default async function OgBilde({ params }: { params: { slug: string } }) {
  let b = null;
  try {
    b = await hentBedrift(params.slug);
  } catch {
    // DB utilgjengelig → generisk bilde
  }
  const navn = b?.navn ?? "Bedriftsflyt";
  const tagline = b?.tagline ?? "";
  const sted = b?.sted ?? "";
  const undertekst = [tagline, sted].filter(Boolean).join(" · ");
  const accent = b?.merkefarge || b?.tema?.accent || "#c0466e";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff" }}>
        <div style={{ display: "flex", height: 18, width: "100%", background: accent }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 80px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
            <div style={{ display: "flex", width: 46, height: 46, borderRadius: 12, background: "#2f3b52", marginRight: 16 }} />
            <div style={{ display: "flex", fontSize: 30, color: "#2f3b52", fontWeight: 700 }}>Bedriftsflyt</div>
          </div>
          <div style={{ display: "flex", fontSize: 74, fontWeight: 800, color: "#241a22", lineHeight: 1.05 }}>{navn}</div>
          {undertekst ? (
            <div style={{ display: "flex", fontSize: 34, color: "#7a6e75", marginTop: 24 }}>{undertekst}</div>
          ) : null}
          <div style={{ display: "flex", marginTop: 42 }}>
            <div style={{ display: "flex", background: accent, color: "#ffffff", fontSize: 28, fontWeight: 700, padding: "14px 28px", borderRadius: 14 }}>
              Book time
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
