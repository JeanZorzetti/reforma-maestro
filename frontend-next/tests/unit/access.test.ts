import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { getAccess } from "@/lib/access";

async function seed(status: (typeof subscriptions.status.enumValues)[number], accessUntil: Date) {
  const [user] = await db
    .insert(users)
    .values({ email: `${crypto.randomUUID()}@teste.com`, passwordHash: "hash" })
    .returning();
  await db.insert(subscriptions).values({ userId: user.id, status, accessUntil });
  return user.id;
}

const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe("getAccess — tabela-verdade R4", () => {
  it("trialing dentro do prazo ⇒ full", async () => {
    const userId = await seed("trialing", future);
    expect((await getAccess(userId)).tier).toBe("full");
  });

  it("trialing fora do prazo ⇒ readonly", async () => {
    const userId = await seed("trialing", past);
    expect((await getAccess(userId)).tier).toBe("readonly");
  });

  it("active ⇒ full", async () => {
    const userId = await seed("active", future);
    expect((await getAccess(userId)).tier).toBe("full");
  });

  it("canceled antes de access_until ⇒ full", async () => {
    const userId = await seed("canceled", future);
    expect((await getAccess(userId)).tier).toBe("full");
  });

  it("canceled depois de access_until ⇒ readonly", async () => {
    const userId = await seed("canceled", past);
    expect((await getAccess(userId)).tier).toBe("readonly");
  });

  it("past_due (dentro da tolerância) ⇒ full", async () => {
    const userId = await seed("past_due", future);
    expect((await getAccess(userId)).tier).toBe("full");
  });

  it("past_due (fora da tolerância) ⇒ readonly", async () => {
    const userId = await seed("past_due", past);
    expect((await getAccess(userId)).tier).toBe("readonly");
  });

  it("expired ⇒ readonly mesmo com access_until no futuro", async () => {
    const userId = await seed("expired", future);
    expect((await getAccess(userId)).tier).toBe("readonly");
  });
});
