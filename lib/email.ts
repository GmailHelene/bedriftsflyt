// E-post via Brevo HTTP-API (https://api.brevo.com/v3/smtp/email).
// No-op (logger bare) hvis BREVO_API_KEY eller MAIL_DEFAULT_SENDER mangler, slik at
// appen kjører fint i dev/mock uten e-postoppsett. Avsenderen MÅ være en verifisert
// avsender i Brevo, ellers avviser Brevo utsendingen.

type SendInput = {
  til: string;
  emne: string;
  html: string;
  tekst?: string;
};

type SendResultat = { ok: boolean; grunn?: string };

// Godtar "Navn <epost@domene.no>" eller bare "epost@domene.no".
function parseAvsender(raw: string): { email: string; name?: string } {
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2].trim() };
  return { email: raw.trim() };
}

export async function sendEpost(input: SendInput): Promise<SendResultat> {
  const apiKey = process.env.BREVO_API_KEY;
  const avsenderRaw = process.env.MAIL_DEFAULT_SENDER;

  if (!apiKey || !avsenderRaw) {
    console.warn(
      "[email] BREVO_API_KEY/MAIL_DEFAULT_SENDER ikke satt - hopper over e-post til",
      input.til
    );
    return { ok: false, grunn: "ikke_konfigurert" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: parseAvsender(avsenderRaw),
        to: [{ email: input.til }],
        subject: input.emne,
        htmlContent: input.html,
        ...(input.tekst ? { textContent: input.tekst } : {}),
      }),
    });

    if (!res.ok) {
      const detalj = await res.text().catch(() => "");
      console.error("[email] Brevo svarte", res.status, detalj.slice(0, 300));
      return { ok: false, grunn: `brevo_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] Utsending feilet:", e instanceof Error ? e.message : e);
    return { ok: false, grunn: "unntak" };
  }
}
