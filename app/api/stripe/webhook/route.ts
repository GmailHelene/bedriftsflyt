import { NextRequest, NextResponse } from "next/server";
import { verifiserWebhook } from "@/lib/stripe";
import { settStripeAbonnement, oppdaterAbonnementForSub } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!verifiserWebhook(raw, sig)) {
    return NextResponse.json({ feil: "Ugyldig signatur." }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ feil: "Ugyldig JSON." }, { status: 400 });
  }

  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  try {
    if (event.type === "checkout.session.completed") {
      const slug = obj.client_reference_id as string | undefined;
      if (slug) {
        await settStripeAbonnement(slug, {
          customerId: (obj.customer as string) ?? null,
          subscriptionId: (obj.subscription as string) ?? null,
          status: "trialing",
        });
      }
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      await oppdaterAbonnementForSub(obj.id as string, (obj.status as string) ?? "active");
    } else if (event.type === "customer.subscription.deleted") {
      await oppdaterAbonnementForSub(obj.id as string, "canceled");
    }
  } catch (e) {
    console.error("[stripe webhook]", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ received: true });
}
