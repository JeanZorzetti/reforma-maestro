import { NextResponse } from "next/server";
import { recordIncident } from "@/lib/incidents";
import { stripe } from "@/lib/stripe";
import { processStripeWebhookEvent } from "@/server/stripe/webhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    await recordIncident("webhook_failed", "/api/stripe/webhook", error);
    return NextResponse.json({ error: "ASSINATURA_INVALIDA" }, { status: 400 });
  }

  const result = await processStripeWebhookEvent(event);
  return NextResponse.json(result);
}
