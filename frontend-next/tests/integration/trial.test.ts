import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { createAccount } from "@/server/actions/auth";

function randomEmail() {
  return `${crypto.randomUUID()}@teste.com`;
}

describe("trial de 14 dias (FR-025c, SC-012)", () => {
  it("conta nova nasce trialing com ~14 dias de acesso", async () => {
    const email = randomEmail();
    const result = await createAccount(email, "senha1234");
    if (!result.ok) throw new Error("setup falhou");

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, result.userId));
    expect(sub.status).toBe("trialing");

    const daysLeft = (sub.accessUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysLeft).toBeGreaterThan(13.9);
    expect(daysLeft).toBeLessThanOrEqual(14);
  });

  it("recadastro com o mesmo e-mail após exclusão da conta nasce expired", async () => {
    const email = randomEmail();
    const first = await createAccount(email, "senha1234");
    if (!first.ok) throw new Error("setup falhou");

    await db.delete(users).where(eq(users.id, first.userId));

    const second = await createAccount(email, "outraSenha1");
    if (!second.ok) throw new Error("recadastro falhou");

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, second.userId));
    expect(sub.status).toBe("expired");
    expect(sub.accessUntil.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
