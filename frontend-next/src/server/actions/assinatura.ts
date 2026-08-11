"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "./types";

const PRICE_ID = process.env.STRIPE_PRICE_ID!;

/** Inicia o Checkout do Stripe. Nunca escreve em `subscriptions` — só o webhook faz isso (R6). */
export async function createCheckoutSession(): Promise<ActionResult | undefined> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  const emTrialVigente = sub?.status === "trialing" && sub.accessUntil > new Date();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: user.id,
    ...(sub?.stripeCustomerId ? { customer: sub.stripeCustomerId } : { customer_email: user.email }),
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${process.env.AUTH_URL}/app/conta?checkout=sucesso`,
    cancel_url: `${process.env.AUTH_URL}/app/assinar?checkout=cancelado`,
    // R2: quem assina antes do fim do trial não perde os dias restantes.
    ...(emTrialVigente
      ? { subscription_data: { trial_end: Math.floor(sub.accessUntil.getTime() / 1000) } }
      : {}),
  });

  redirect(session.url!);
}

/** Abre o Customer Portal do Stripe para gerenciar/cancelar a assinatura existente. */
export async function createPortalSession(): Promise<ActionResult | undefined> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };

  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);
  if (!sub?.stripeCustomerId) return { ok: false, error: "SEM_ASSINATURA" };

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.AUTH_URL}/app/conta`,
  });

  redirect(session.url);
}
