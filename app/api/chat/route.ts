import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hentBedrift, hentChatbotConfig, lagreChatMelding, varsleChatOmMulig } from "@/lib/repository";
import { svarKunde, harKI } from "@/lib/chat";
import { erRateLimited } from "@/lib/ratelimit";
import { sendEpost } from "@/lib/email";

export const runtime = "nodejs";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

const schema = z.object({
  slug: z.string().min(1),
  melding: z.string().min(1).max(1000),
  historikk: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(20)
    .optional(),
  lang: z.enum(["no", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  if (!harKI()) {
    return NextResponse.json({ feil: "KI er ikke konfigurert (mangler ANTHROPIC_API_KEY)." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukjent";
  if (await erRateLimited("chat:" + ip)) {
    return NextResponse.json({ feil: "For mange meldinger. Vent et minutt." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const p = schema.safeParse(body);
  if (!p.success) {
    return NextResponse.json({ feil: "Ugyldige data." }, { status: 400 });
  }

  const b = await hentBedrift(p.data.slug);
  if (!b) {
    return NextResponse.json({ feil: "Fant ikke bedriften." }, { status: 404 });
  }

  try {
    const config = await hentChatbotConfig(p.data.slug);
    const svar = await svarKunde(b, p.data.melding, p.data.historikk, config, p.data.lang ?? "no");
    // Lagre samtalen så bedriften kan se den i dashbordet (best-effort).
    try {
      await lagreChatMelding(p.data.slug, "user", p.data.melding);
      await lagreChatMelding(p.data.slug, "assistant", svar);
      // Varsle bedriften (throttlet: maks én e-post per 6. time).
      const til = await varsleChatOmMulig(p.data.slug);
      if (til) {
        const base = process.env.APP_BASE_URL || "";
        await sendEpost({
          til,
          emne: "En kunde chattet med assistenten din",
          html:
            `<p>En kunde stilte et spørsmål til KI-assistenten på siden din:</p>` +
            `<blockquote style="border-left:3px solid #ccc;padding-left:10px;color:#555">${esc(p.data.melding)}</blockquote>` +
            `<p>Assistenten svarte automatisk. Se alle samtalene: <a href="${base}/dashboard/samtaler">${base}/dashboard/samtaler</a></p>` +
            `<p style="color:#888;font-size:12px">Du får maks én slik e-post hver 6. time.</p>`,
          tekst:
            `En kunde chattet med assistenten din: "${p.data.melding}"\n\n` +
            `Se samtalene: ${base}/dashboard/samtaler`,
        });
      }
    } catch {
      /* logging/varsel skal aldri velte svaret */
    }
    return NextResponse.json({ svar });
  } catch (e) {
    console.error("[chat] KI-kall feilet:", e instanceof Error ? e.message : e);
    return NextResponse.json({ feil: "KI-feil. Prøv igjen om litt." }, { status: 502 });
  }
}
