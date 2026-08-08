import { NextRequest, NextResponse } from "next/server";
import { hentLedigeTider } from "@/lib/repository";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slug = sp.get("slug") ?? "";
  const service = sp.get("service") ?? "";
  const dato = sp.get("dato") ?? "";

  if (!slug || !service || !/^\d{4}-\d{2}-\d{2}$/.test(dato)) {
    return NextResponse.json({ tider: [] }, { status: 400 });
  }

  const tider = await hentLedigeTider(slug, service, dato);
  return NextResponse.json({ tider });
}
