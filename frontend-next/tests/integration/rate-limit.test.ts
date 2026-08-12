import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { clearAttempts } from "@/lib/rate-limit";

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(),
}));
import { sendPasswordResetEmail } from "@/lib/email";
import { createAccount, login, requestPasswordReset } from "@/server/actions/auth";

// login() e requestPasswordReset() falham (senha errada / fluxo normal) sem
// nunca chamar signIn() com sucesso, então não tocam cookies()/redirect() —
// só o caminho feliz do login precisa de request scope (ver isolamento.test.ts).

function randomEmail() {
  return `${crypto.randomUUID()}@teste.com`;
}

function loginForm(email: string, senha: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("senha", senha);
  return formData;
}

describe("rate limit — login (FR-005, FR-007)", () => {
  it("bloqueia a 11ª tentativa com MUITAS_TENTATIVAS e libera depois de clearAttempts", async () => {
    const email = randomEmail();
    await createAccount(email, "senha1234");

    for (let i = 0; i < 10; i++) {
      const result = await login(loginForm(email, "senhaerrada"));
      expect(result?.ok).toBe(false);
      if (result?.ok === false) expect(result.error).toBe("CREDENCIAIS_INVALIDAS");
    }

    const eleventh = await login(loginForm(email, "senhaerrada"));
    expect(eleventh?.ok).toBe(false);
    if (eleventh?.ok === false) {
      expect(eleventh.error).toBe("MUITAS_TENTATIVAS");
      expect(eleventh.retryAfterSeconds).toBeGreaterThan(0);
    }

    const [event] = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.event, "rate_limited"), isNull(auditLog.userId)));
    expect(event).toBeDefined();
    expect(event.detail).toHaveProperty("scope", "login");
    expect(JSON.stringify(event.detail)).not.toContain(email);
    expect(JSON.stringify(event.detail).toLowerCase()).not.toContain("hash");

    // Cenário 6: quem lembrou a senha entra normalmente depois que o contador zera.
    await clearAttempts("login", email);
    const afterClear = await login(loginForm(email, "senhaerrada"));
    expect(afterClear?.ok).toBe(false);
    if (afterClear?.ok === false) expect(afterClear.error).toBe("CREDENCIAIS_INVALIDAS");
  });
});

describe("rate limit — requestPasswordReset (FR-006)", () => {
  it("responde igual antes e depois do limite e para de enviar e-mail", async () => {
    const email = randomEmail();
    await createAccount(email, "senha1234");

    const before = new FormData();
    before.set("email", email);
    const beforeResult = await requestPasswordReset(before);

    for (let i = 1; i < 5; i++) {
      const fd = new FormData();
      fd.set("email", email);
      await requestPasswordReset(fd);
    }
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(5);

    const over = new FormData();
    over.set("email", email);
    const overResult = await requestPasswordReset(over);

    expect(overResult).toEqual(beforeResult);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(5);
  });
});
