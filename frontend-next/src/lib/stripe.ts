import Stripe from "stripe";
import type { subscriptions } from "@/db/schema";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type OurStatus = (typeof subscriptions.status.enumValues)[number];

/**
 * Mapa `subscription.status` do Stripe → nosso status (contracts/stripe-webhook.md).
 * `incomplete`/`paused` retornam `null`: estado transitório, não decide acesso.
 */
export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): OurStatus | null {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "expired";
    case "incomplete":
    case "paused":
    default:
      return null;
  }
}
