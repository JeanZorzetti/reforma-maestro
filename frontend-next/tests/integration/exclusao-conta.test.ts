import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { auditLog, lancamentos, obras, subscriptions, users } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { createAccount, deleteAccountCore } from "@/server/actions/auth";

// deleteAccountCore recebe userId direto (em vez de ler auth()) pelo mesmo
// motivo de createAccount: testável sem request scope. deleteAccount(formData)
// é a casca fina que lê a sessão e chama signOut() (ver isolamento.test.ts).

async function setup() {
  const email = `${crypto.randomUUID()}@teste.com`;
  const account = await createAccount(email, "senha1234");
  if (!account.ok) throw new Error("setup falhou");
  const [obra] = await db
    .insert(obras)
    .values({ userId: account.userId, nome: "Obra", orcamentoTetoCents: 100_000, reservaPct: "10" })
    .returning();
  await db.insert(lancamentos).values({
    obraId: obra.id,
    data: "2026-01-01",
    categoria: "material",
    item: "Item",
    previstoCents: 1000,
  });
  return account.userId;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteAccountCore (FR-009 a FR-012)", () => {
  it("senha errada não apaga nada", async () => {
    const userId = await setup();
    const result = await deleteAccountCore(userId, "senhaerrada");
    expect(result.ok).toBe(false);

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    expect(user).toBeDefined();
  });

  it("falha do Stripe aborta com STRIPE_INDISPONIVEL deixando a conta íntegra", async () => {
    const userId = await setup();
    await db
      .update(subscriptions)
      .set({ stripeSubscriptionId: "sub_teste_123" })
      .where(eq(subscriptions.userId, userId));

    vi.spyOn(stripe.subscriptions, "cancel").mockRejectedValue(new Error("stripe fora do ar"));

    const result = await deleteAccountCore(userId, "senha1234");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("STRIPE_INDISPONIVEL");

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    expect(user).toBeDefined();
  });

  it("sucesso cancela no Stripe, apaga em cascata e audita anonimamente", async () => {
    const userId = await setup();
    await db
      .update(subscriptions)
      .set({ stripeSubscriptionId: "sub_teste_456" })
      .where(eq(subscriptions.userId, userId));

    const cancelSpy = vi.spyOn(stripe.subscriptions, "cancel").mockResolvedValue({} as never);

    const result = await deleteAccountCore(userId, "senha1234");
    expect(result.ok).toBe(true);
    expect(cancelSpy).toHaveBeenCalledWith("sub_teste_456");

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    expect(user).toBeUndefined();

    const remainingObras = await db.select().from(obras).where(eq(obras.userId, userId));
    expect(remainingObras).toHaveLength(0);

    const [event] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.event, "account_deleted"));
    expect(event).toBeDefined();
    expect(event.userId).toBeNull();
    expect(event.detail).toEqual({});
  });

  it("sem assinatura Stripe associada, apaga direto", async () => {
    const userId = await setup();
    const result = await deleteAccountCore(userId, "senha1234");
    expect(result.ok).toBe(true);
  });
});
