"use server";

import { redirect } from "next/navigation";
import { verifiserBookingToken } from "@/lib/token";
import { kansellerBooking, hentBookingForAvbestilling, hentBedrift } from "@/lib/repository";
import { sendEpost } from "@/lib/email";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

export async function avbestill(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const id = verifiserBookingToken(token);
  if (!id) redirect(`/avbestill/${encodeURIComponent(token)}?feil=1`);

  const info = await hentBookingForAvbestilling(id);
  await kansellerBooking(id);

  // Varsle bedriften om avbestillingen (best-effort - skal aldri velte avbestillingen).
  if (info) {
    try {
      const bedrift = await hentBedrift(info.slug);
      if (bedrift?.varselEpost) {
        await sendEpost({
          til: bedrift.varselEpost,
          emne: `Avbestilling: ${info.tjeneste ?? "time"} ${info.naar}`,
          html:
            `<p>En kunde har avbestilt en time:</p>` +
            `<p><strong>${esc(info.tjeneste ?? "Time")}</strong><br>${esc(info.naar)}</p>` +
            `<p>Tiden er nå ledig igjen.</p>`,
          tekst: `En kunde har avbestilt:\n${info.tjeneste ?? "Time"}\n${info.naar}\n\nTiden er nå ledig igjen.`,
        });
      }
    } catch {
      /* ignorer */
    }
  }

  redirect(`/avbestill/${encodeURIComponent(token)}?avbestilt=1`);
}
