import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { stripeEvents, subscriptions, users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { sendPaymentFailedEmail } from "@/lib/email";
import { recordIncident } from "@/lib/incidents";
import { mapStripeStatus, stripe } from "@/lib/stripe";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type SubscriptionRow = typeof subscriptions.$inferSelect;
type SubscriptionPatch = Partial<typeof subscriptions.$inferInsert>;

export type WebhookResponse =
  | { duplicado: true }
  | { unmatched: true }
  | { fora_de_ordem: true }
  | { ignorado: true }
  | { ok: true };

const HANDLED_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

function periodEndOf(subscription: Stripe.Subscription): Date {
  return new Date(subscription.items.data[0].current_period_end * 1000);
}

function extractIds(event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;

  const clientReferenceId = typeof object.client_reference_id === "string" ? object.client_reference_id : null;
  const customerId = typeof object.customer === "string" ? object.customer : null;

  let subscriptionId: string | null = null;
  if (object.object === "subscription" && typeof object.id === "string") {
    subscriptionId = object.id;
  } else if (typeof object.subscription === "string") {
    subscriptionId = object.subscription;
  } else {
    const parent = object.parent as { subscription_details?: { subscription?: string } } | undefined;
    if (typeof parent?.subscription_details?.subscription === "string") {
      subscriptionId = parent.subscription_details.subscription;
    }
  }

  return { clientReferenceId, customerId, subscriptionId };
}

async function resolveUserId(tx: Tx, ids: ReturnType<typeof extractIds>): Promise<string | null> {
  if (ids.clientReferenceId) {
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, ids.clientReferenceId)).limit(1);
    if (user) return user.id;
  }
  if (ids.customerId) {
    const [sub] = await tx
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, ids.customerId))
      .limit(1);
    if (sub) return sub.userId;
  }
  if (ids.subscriptionId) {
    const [sub] = await tx
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, ids.subscriptionId))
      .limit(1);
    if (sub) return sub.userId;
  }
  return null;
}

/** Contrato: contracts/stripe-webhook.md — tabela "Eventos tratados". `null` = estado transitório, sem mudança. */
async function computeTransition(event: Stripe.Event, sub: SubscriptionRow): Promise<SubscriptionPatch | null> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subscriptionId) return null;
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = periodEndOf(stripeSub);
      const customerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
      return {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: "active",
        accessUntil: periodEnd > sub.accessUntil ? periodEnd : sub.accessUntil,
      };
    }
    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const mapped = mapStripeStatus(stripeSub.status);
      if (mapped === null) return null;
      const cancelando = stripeSub.cancel_at_period_end && mapped === "active";
      return {
        status: cancelando ? "canceled" : mapped,
        accessUntil: periodEndOf(stripeSub),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      };
    }
    case "customer.subscription.deleted":
      return { status: "expired", accessUntil: new Date() };
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const parentSub = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof parentSub === "string" ? parentSub : parentSub?.id;
      if (!subscriptionId) return null;
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      return { status: "active", accessUntil: periodEndOf(stripeSub) };
    }
    case "invoice.payment_failed":
      return { status: "past_due" };
    default:
      return null;
  }
}

type PipelineOutcome =
  | { kind: "duplicado" }
  | { kind: "unmatched"; userId: string | null }
  | { kind: "fora_de_ordem" }
  | { kind: "ignorado" }
  | { kind: "aplicado"; userId: string; type: string };

async function runPipeline(event: Stripe.Event): Promise<PipelineOutcome> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(stripeEvents)
      .values({ id: event.id, type: event.type, eventCreated: new Date(event.created * 1000), applied: false })
      .onConflictDoNothing()
      .returning({ id: stripeEvents.id });
    if (inserted.length === 0) return { kind: "duplicado" };

    if (!HANDLED_TYPES.has(event.type)) return { kind: "ignorado" };

    const userId = await resolveUserId(tx, extractIds(event));
    if (!userId) {
      await tx.update(stripeEvents).set({ unmatched: true }).where(eq(stripeEvents.id, event.id));
      return { kind: "unmatched", userId: null };
    }

    const [sub] = await tx.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    if (!sub) {
      await tx.update(stripeEvents).set({ unmatched: true }).where(eq(stripeEvents.id, event.id));
      return { kind: "unmatched", userId };
    }

    const eventCreatedAt = new Date(event.created * 1000);
    if (sub.lastEventAt && eventCreatedAt < sub.lastEventAt) {
      return { kind: "fora_de_ordem" };
    }

    const patch = await computeTransition(event, sub);

    await tx
      .update(subscriptions)
      .set({ ...patch, lastEventAt: eventCreatedAt, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId));
    await tx.update(stripeEvents).set({ applied: true }).where(eq(stripeEvents.id, event.id));

    return { kind: "aplicado", userId, type: event.type };
  });
}

export async function processStripeWebhookEvent(event: Stripe.Event): Promise<WebhookResponse> {
  const outcome = await runPipeline(event);

  switch (outcome.kind) {
    case "duplicado":
      return { duplicado: true };
    case "ignorado":
      return { ignorado: true };
    case "unmatched":
      await logAudit(null, "webhook_unmatched", { eventId: event.id, type: event.type });
      await recordIncident("webhook_failed", "/api/stripe/webhook", new Error(`unmatched: ${event.type}`), {
        eventId: event.id,
        ...(outcome.userId ? { userId: outcome.userId } : {}),
      });
      return { unmatched: true };
    case "fora_de_ordem":
      return { fora_de_ordem: true };
    case "aplicado":
      await logAudit(outcome.userId, "subscription_changed", { eventId: event.id, type: outcome.type });
      if (outcome.type === "invoice.payment_failed") {
        const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, outcome.userId)).limit(1);
        if (user) await sendPaymentFailedEmail(user.email);
      }
      return { ok: true };
  }
}
