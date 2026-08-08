"use client";

import { useState } from "react";

// Komprimerer bildet i nettleseren (canvas → JPEG) før det sendes, så databasen holdes liten.
function komprimer(fil: File, maxDim: number): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width >= height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return rej(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        res(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => rej(new Error("bilde"));
      img.src = reader.result as string;
    };
    reader.onerror = () => rej(new Error("fil"));
    reader.readAsDataURL(fil);
  });
}

export default function BildeOpplaster({
  action,
  knappTekst,
  maxDim = 900,
}: {
  action: (formData: FormData) => Promise<void>;
  knappTekst: string;
  maxDim?: number;
}) {
  const [dataUri, setDataUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [feil, setFeil] = useState("");

  async function velg(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0];
    if (!fil) return;
    setFeil("");
    if (!fil.type.startsWith("image/")) {
      setFeil("Velg en bildefil.");
      return;
    }
    setBusy(true);
    try {
      setDataUri(await komprimer(fil, maxDim));
    } catch {
      setFeil("Klarte ikke å lese bildet. Prøv et annet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input type="hidden" name="bilde" value={dataUri} />
      <input
        type="file"
        accept="image/*"
        onChange={velg}
        style={{ fontSize: 14, fontFamily: "inherit" }}
      />
      {dataUri && (
        <img
          src={dataUri}
          alt="Forhåndsvisning"
          style={{ maxWidth: 140, maxHeight: 140, borderRadius: 12, objectFit: "cover", border: "1px solid var(--line)" }}
        />
      )}
      {feil && <p style={{ color: "var(--accent-ink)", fontSize: 13 }}>{feil}</p>}
      <button
        className="btn"
        type="submit"
        disabled={!dataUri || busy}
        style={{ width: "auto", padding: "10px 18px", opacity: !dataUri || busy ? 0.5 : 1 }}
      >
        {busy ? "Behandler …" : knappTekst}
      </button>
    </form>
  );
}
