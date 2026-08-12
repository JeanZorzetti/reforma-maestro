import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { authAttempts } from "@/db/schema";
import { clearAttempts, consumeAttempt } from "@/lib/rate-limit";

function randomEmail() {
  return `${crypto.randomUUID()}@teste.com`;
}

function resetKey(email: string) {
  return `reset:${createHash("sha256").update(email).digest("hex")}`;
}

describe("consumeAttempt — limite por escopo (reset: 5/60min)", () => {
  it("permite até o limite e recusa a próxima", async () => {
    const email = randomEmail();
    for (let i = 0; i < 5; i++) {
      const result = await consumeAttempt("reset", email);
      expect(result.allowed).toBe(true);
    }
    const sixth = await consumeAttempt("reset", email);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("retryAfterSeconds é calculado a partir de window_start", async () => {
    const email = randomEmail();
    const key = resetKey(email);
    const elapsedSeconds = 600; // 10 min dentro da janela de 60 min
    await db.insert(authAttempts).values({
      key,
      windowStart: new Date(Date.now() - elapsedSeconds * 1000),
      count: 5,
    });

    const result = await consumeAttempt("reset", email);
    expect(result.allowed).toBe(false);
    const expected = 60 * 60 - elapsedSeconds;
    expect(result.retryAfterSeconds).toBeGreaterThan(expected - 10);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(expected);
  });

  it("reinicia a janela depois de expirada", async () => {
    const email = randomEmail();
    const key = resetKey(email);
    await db.insert(authAttempts).values({
      key,
      windowStart: new Date(Date.now() - 61 * 60 * 1000),
      count: 5,
    });

    const result = await consumeAttempt("reset", email);
    expect(result.allowed).toBe(true);

    const [row] = await db.select().from(authAttempts).where(eq(authAttempts.key, key));
    expect(row.count).toBe(1);
  });
});

describe("clearAttempts", () => {
  it("zera a contagem da conta", async () => {
    const email = randomEmail();
    await consumeAttempt("login", email);
    await consumeAttempt("login", email);
    await clearAttempts("login", email);

    const key = `login:${createHash("sha256").update(email).digest("hex")}`;
    const [row] = await db.select().from(authAttempts).where(eq(authAttempts.key, key));
    expect(row).toBeUndefined();
  });
});
