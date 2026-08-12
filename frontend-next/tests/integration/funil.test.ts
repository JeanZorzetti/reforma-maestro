import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { getAccess } from "@/lib/access";
import { stripe } from "@/lib/stripe";
import { createAccount } from "@/server/actions/auth";
import { processStripeWebhookEvent } from "@/server/stripe/webhook";

// FR-032: percurso completo — cadastro, teste, evento de assinatura ASSINADO
// (constructEvent real, não bypassado como em webhook.test.ts) e liberação de acesso.
describe("funil completo: cadastro → trial → checkout assinado → acesso liberado", () => {
  it("createAccount → getAccess (trial) → evento Stripe assinado → processStripeWebhookEvent → getAccess (full/active)", async () => {
    const email = `${randomUUID()}@teste.com`;
    const account = await createAccount(email, "senha1234");
    if (!account.ok) throw new Error("setup falhou");

    const trial = await getAccess(account.userId);
    expect(trial.tier).toBe("full");
    expect(trial.status).toBe("trialing");

    const subscriptionId = `sub_test_${randomUUID()}`;
    const customerId = `cus_test_${randomUUID()}`;
    const currentPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    vi.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue({
      id: subscriptionId,
      items: { data: [{ current_period_end: currentPeriodEnd }] },
    } as never);

    const rawEvent = {
      id: `evt_${randomUUID()}`,
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          object: "checkout.session",
          client_reference_id: account.userId,
          customer: customerId,
          subscription: subscriptionId,
        },
      },
    };

    const payload = JSON.stringify(rawEvent);
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const event = stripe.webhooks.constructEvent(payload, header, secret);

    const result = await processStripeWebhookEvent(event);
    expect(result).toEqual({ ok: true });

    const full = await getAccess(account.userId);
    expect(full.tier).toBe("full");
    expect(full.status).toBe("active");
  });
});
