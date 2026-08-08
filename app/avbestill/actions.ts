"use server";

import { redirect } from "next/navigation";
import { verifiserBookingToken } from "@/lib/token";
import { kansellerBooking } from "@/lib/repository";

export async function avbestill(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const id = verifiserBookingToken(token);
  if (!id) redirect(`/avbestill/${encodeURIComponent(token)}?feil=1`);
  await kansellerBooking(id);
  redirect(`/avbestill/${encodeURIComponent(token)}?avbestilt=1`);
}
