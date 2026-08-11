import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { obras, stripeEvents, subscriptions, users } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { createAccount } from "@/server/actions/auth";
import { processStripeWebhookEvent } from "@/server/stripe/webhook";

vi.mock("@/lib/email", () => ({
  sendPaymentFailedEmail: vi.fn(),
  sendTrialExpiringEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));
import { sendPaymentFailedEmail } from "@/lib/email";

// tests/integration/isolamento.test.ts explica por que os testes de integração
// chamam a lógica diretamente em vez de subir um servidor HTTP: aqui,
// processStripeWebhookEvent (a mesma função usada pelo Route Handler) não
// depende de cookies()/auth(), então é chamada direto com eventos sintéticos.

let seq = 0;
function eventId() {
  return `evt_${Date.now()}_${seq++}`;
}

function unix(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

// Stripe só tem precisão de segundo — trunca antes de comparar com o valor
// que volta do banco depois de passar por um timestamp Stripe sintético.
function seconds(date: Date) {
  return new Date(unix(date) * 1000);
}

function makeEvent(type: string, object: Record<string, unknown>, created: Date): Stripe.Event {
  return {
    id: eventId(),
    type,
    created: unix(created),
    data: { object },
  } as unknown as Stripe.Event;
}

function checkoutSession(opts: { userId?: string; customer?: string; subscription?: string }) {
  return {
    object: "checkout.session",
    client_reference_id: opts.userId ?? null,
    customer: opts.customer ?? null,
    subscription: opts.subscription ?? null,
  };
}

function stripeSubscription(opts: {
  id: string;
  customer: string;
  status: Stripe.Subscription.Status;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd: Date;
}) {
  return {
    object: "subscription",
    id: opts.id,
    customer: opts.customer,
    status: opts.status,
    cancel_at_period_end: opts.cancelAtPeriodEnd ?? false,
    items: { data: [{ current_period_end: unix(opts.currentPeriodEnd) }] },
  };
}

function invoice(opts: { customer: string; subscription: string; kind: "payment_succeeded" | "payment_failed" }) {
  return {
    object: "invoice",
    customer: opts.customer,
    parent: { subscription_details: { subscription: opts.subscription } },
  };
}

function fakeStripeSubscription(id: string, customer: string, currentPeriodEnd: Date): Stripe.Response<Stripe.Subscription> {
  return {
    ...stripeSubscription({ id, customer, status: "active", currentPeriodEnd }),
    lastResponse: { headers: {}, requestId: "req_test", statusCode: 200 },
  } as unknown as Stripe.Response<Stripe.Subscription>;
}

async function setupUsuarioTrial() {
  const email = `${randomUUID()}@teste.com`;
  const account = await createAccount(email, "senha1234");
  if (!account.ok) throw new Error("setup falhou");
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, account.userId)).limit(1);
  return { userId: account.userId, email, sub };
}

async function getSub(userId: string) {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return sub;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("webhook do Stripe (contracts/stripe-webhook.md)", () => {
  it("1. assinatura de conta em trial ⇒ active e acesso full mantido sem intervalo", async () => {
    const { userId, sub } = await setupUsuarioTrial();
    const novoPeriodo = seconds(new Date(sub.accessUntil.getTime() + 30 * 24 * 60 * 60 * 1000));
    vi.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(fakeStripeSubscription("sub_1", "cus_1", novoPeriodo));

    const event = makeEvent(
      "checkout.session.completed",
      checkoutSession({ userId, customer: "cus_1", subscription: "sub_1" }),
      new Date(),
    );
    const result = await processStripeWebhookEvent(event);

    expect(result).toEqual({ ok: true });
    const updated = await getSub(userId);
    expect(updated.status).toBe("active");
    expect(updated.accessUntil.getTime()).toBe(novoPeriodo.getTime());
    expect(updated.accessUntil.getTime()).toBeGreaterThanOrEqual(sub.accessUntil.getTime());
  });

  it("2. mesmo evento entregue duas vezes ⇒ segunda resposta duplicado:true e subscriptions inalterada", async () => {
    const { userId, sub } = await setupUsuarioTrial();
    const novoPeriodo = seconds(new Date(sub.accessUntil.getTime() + 30 * 24 * 60 * 60 * 1000));
    vi.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(fakeStripeSubscription("sub_1", "cus_1", novoPeriodo));

    const event = makeEvent(
      "checkout.session.completed",
      checkoutSession({ userId, customer: "cus_1", subscription: "sub_1" }),
      new Date(),
    );
    expect(await processStripeWebhookEvent(event)).toEqual({ ok: true });
    const apos1a = await getSub(userId);

    expect(await processStripeWebhookEvent(event)).toEqual({ duplicado: true });
    const apos2a = await getSub(userId);
    expect(apos2a).toEqual(apos1a);
  });

  it("3. customer.subscription.updated antigo chegando depois de um recente ⇒ applied=false, access_until preservado", async () => {
    const { userId } = await setupUsuarioTrial();
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" })
      .where(eq(subscriptions.userId, userId));

    const agora = new Date();
    const periodoRecente = seconds(new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000));
    const eventoRecente = makeEvent(
      "customer.subscription.updated",
      stripeSubscription({ id: "sub_1", customer: "cus_1", status: "active", currentPeriodEnd: periodoRecente }),
      agora,
    );
    expect(await processStripeWebhookEvent(eventoRecente)).toEqual({ ok: true });
    const depoisDoRecente = await getSub(userId);
    expect(depoisDoRecente.accessUntil.getTime()).toBe(periodoRecente.getTime());

    const antigo = new Date(agora.getTime() - 60 * 60 * 1000);
    const periodoAntigo = seconds(new Date(antigo.getTime() + 30 * 24 * 60 * 60 * 1000));
    const eventoAntigo = makeEvent(
      "customer.subscription.updated",
      stripeSubscription({ id: "sub_1", customer: "cus_1", status: "active", currentPeriodEnd: periodoAntigo }),
      antigo,
    );
    expect(await processStripeWebhookEvent(eventoAntigo)).toEqual({ fora_de_ordem: true });

    const final = await getSub(userId);
    expect(final.accessUntil.getTime()).toBe(periodoRecente.getTime());
  });

  it("4. payment_failed seguido de payment_succeeded ⇒ volta a active e access_until estendido", async () => {
    const { userId, sub } = await setupUsuarioTrial();
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1", status: "active" })
      .where(eq(subscriptions.userId, userId));

    const falhou = makeEvent("invoice.payment_failed", invoice({ customer: "cus_1", subscription: "sub_1", kind: "payment_failed" }), new Date());
    expect(await processStripeWebhookEvent(falhou)).toEqual({ ok: true });

    const apos = await getSub(userId);
    expect(apos.status).toBe("past_due");
    expect(apos.accessUntil.getTime()).toBe(sub.accessUntil.getTime());
    expect(sendPaymentFailedEmail).toHaveBeenCalledTimes(1);

    const novoPeriodo = seconds(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
    vi.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(fakeStripeSubscription("sub_1", "cus_1", novoPeriodo));
    const pagou = makeEvent(
      "invoice.payment_succeeded",
      invoice({ customer: "cus_1", subscription: "sub_1", kind: "payment_succeeded" }),
      new Date(),
    );
    expect(await processStripeWebhookEvent(pagou)).toEqual({ ok: true });

    const final = await getSub(userId);
    expect(final.status).toBe("active");
    expect(final.accessUntil.getTime()).toBe(novoPeriodo.getTime());
    expect(final.accessUntil.getTime()).toBeGreaterThan(apos.accessUntil.getTime());
  });

  it("5. cancelamento ⇒ full até access_until, readonly depois, obras intactas", async () => {
    const { userId } = await setupUsuarioTrial();
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1", status: "active" })
      .where(eq(subscriptions.userId, userId));
    const [obra] = await db
      .insert(obras)
      .values({ userId, nome: "Obra existente", orcamentoTetoCents: 100_000, reservaPct: "10" })
      .returning();

    const evento = makeEvent(
      "customer.subscription.deleted",
      stripeSubscription({ id: "sub_1", customer: "cus_1", status: "canceled", currentPeriodEnd: new Date() }),
      new Date(),
    );
    expect(await processStripeWebhookEvent(evento)).toEqual({ ok: true });

    const apos = await getSub(userId);
    expect(apos.status).toBe("expired");
    expect(apos.accessUntil.getTime()).toBeLessThanOrEqual(Date.now());

    const obraAinda = await db.select().from(obras).where(eq(obras.id, obra.id)).limit(1);
    expect(obraAinda).toHaveLength(1);
    expect(obraAinda[0].nome).toBe("Obra existente");
  });

  it("6. evento sem usuário resolvível ⇒ unmatched:true, 200, nenhuma conta criada", async () => {
    const antesDoTotal = (await db.select({ id: users.id }).from(users)).length;

    const event = makeEvent(
      "invoice.payment_failed",
      invoice({ customer: "cus_inexistente", subscription: "sub_inexistente", kind: "payment_failed" }),
      new Date(),
    );
    const result = await processStripeWebhookEvent(event);

    expect(result).toEqual({ unmatched: true });
    const depoisDoTotal = (await db.select({ id: users.id }).from(users)).length;
    expect(depoisDoTotal).toBe(antesDoTotal);

    const [row] = await db.select().from(stripeEvents).where(eq(stripeEvents.id, event.id)).limit(1);
    expect(row.unmatched).toBe(true);
    expect(row.applied).toBe(false);
  });

  it("7. assinatura inválida no header ⇒ 400 e zero escrita", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "assinatura-invalida" },
      body: JSON.stringify({ id: "evt_fake", type: "checkout.session.completed" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "ASSINATURA_INVALIDA" });

    const linhas = await db.select().from(stripeEvents);
    expect(linhas).toHaveLength(0);
  });

  it("8. reassinatura depois de expired ⇒ full restabelecido com dados da obra anterior preservados", async () => {
    const { userId } = await setupUsuarioTrial();
    const [obra] = await db
      .insert(obras)
      .values({ userId, nome: "Obra antiga", orcamentoTetoCents: 50_000, reservaPct: "10" })
      .returning();
    await db
      .update(subscriptions)
      .set({
        status: "expired",
        accessUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
      })
      .where(eq(subscriptions.userId, userId));

    const novoPeriodo = seconds(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    vi.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(fakeStripeSubscription("sub_2", "cus_1", novoPeriodo));
    const event = makeEvent(
      "checkout.session.completed",
      checkoutSession({ userId, customer: "cus_1", subscription: "sub_2" }),
      new Date(),
    );
    expect(await processStripeWebhookEvent(event)).toEqual({ ok: true });

    const apos = await getSub(userId);
    expect(apos.status).toBe("active");
    expect(apos.accessUntil.getTime()).toBe(novoPeriodo.getTime());
    expect(apos.stripeSubscriptionId).toBe("sub_2");

    const obraAinda = await db.select().from(obras).where(eq(obras.id, obra.id)).limit(1);
    expect(obraAinda).toHaveLength(1);
    expect(obraAinda[0].nome).toBe("Obra antiga");
  });

  it("9. assinatura no dia 4 de um trial de 14 ⇒ access_until não perde nem conta dias duas vezes", async () => {
    const { userId, sub } = await setupUsuarioTrial();
    // access_until já é signup + 14 dias, independente de "em que dia do trial" o checkout ocorre —
    // o trial_end enviado ao Stripe é sempre igual ao access_until atual (T053a).
    const primeiraCobranca = seconds(new Date(sub.accessUntil.getTime() + 30 * 24 * 60 * 60 * 1000));
    vi.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(fakeStripeSubscription("sub_1", "cus_1", primeiraCobranca));

    const event = makeEvent(
      "checkout.session.completed",
      checkoutSession({ userId, customer: "cus_1", subscription: "sub_1" }),
      new Date(),
    );
    expect(await processStripeWebhookEvent(event)).toEqual({ ok: true });

    const apos = await getSub(userId);
    // max(current_period_end, access_until) === current_period_end: não soma os dias
    // restantes do trial a current_period_end, só troca pelo valor maior.
    expect(apos.accessUntil.getTime()).toBe(primeiraCobranca.getTime());
    expect(apos.accessUntil.getTime()).toBeGreaterThan(sub.accessUntil.getTime());
  });
});
