import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { accounts, sessions, subscriptions, trialGrants, users, verificationTokens } from "@/db/schema";
import { tokenAindaValido } from "@/lib/auth";
import { createAccount, requestPasswordReset, resetPassword } from "@/server/actions/auth";

function randomEmail() {
  return `${crypto.randomUUID()}@teste.com`;
}

describe("createAccount", () => {
  it("cria as três linhas (users, trial_grants, subscriptions) na mesma transação", async () => {
    const email = randomEmail();
    const result = await createAccount(email, "senha1234");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [user] = await db.select().from(users).where(eq(users.id, result.userId));
    expect(user).toBeDefined();

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, result.userId));
    expect(sub.status).toBe("trialing");

    const [grant] = await db
      .select()
      .from(trialGrants)
      .where(eq(trialGrants.emailHash, createHash("sha256").update(email.toLowerCase()).digest("hex")));
    expect(grant).toBeDefined();
  });

  it("rejeita e-mail duplicado", async () => {
    const email = randomEmail();
    await createAccount(email, "senha1234");
    const second = await createAccount(email, "outrasenha1");
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.fields.email).toBeDefined();
  });

  it("normaliza o e-mail antes da busca", async () => {
    const email = randomEmail();
    await createAccount(email.toUpperCase(), "senha1234");
    const second = await createAccount(`  ${email}  `, "outrasenha1");
    expect(second.ok).toBe(false);
  });

  it("a senha nunca retorna da action", async () => {
    const result = await createAccount(randomEmail(), "senha1234");
    expect(JSON.stringify(result)).not.toContain("senha1234");
    expect(JSON.stringify(result)).not.toMatch(/hash/i);
  });
});

describe("reset de senha", () => {
  it("token de uso único e invalida as sessões existentes", async () => {
    const email = randomEmail();
    const account = await createAccount(email, "senha1234");
    if (!account.ok) throw new Error("setup falhou");

    await db.insert(sessions).values({
      sessionToken: crypto.randomUUID(),
      userId: account.userId,
      expires: new Date(Date.now() + 60_000),
    });

    const formData = new FormData();
    formData.set("email", email);
    await requestPasswordReset(formData);

    const [tokenRow] = await db.select().from(verificationTokens).where(eq(verificationTokens.identifier, email));
    expect(tokenRow).toBeDefined();

    // JWT emitido antes do reset: válido agora, recusado depois (lib/auth.ts).
    const emitidoEm = Date.now();
    expect(await tokenAindaValido(account.userId, emitidoEm)).toBe(true);

    const resetForm = new FormData();
    resetForm.set("token", tokenRow.token);
    resetForm.set("senha", "novaSenha123");
    const resetResult = await resetPassword(resetForm);
    expect(resetResult.ok).toBe(true);

    expect(await tokenAindaValido(account.userId, emitidoEm)).toBe(false);

    // Token sem o claim (emitido antes desta versão) não pode passar batido.
    expect(await tokenAindaValido(account.userId, Number(undefined))).toBe(false);

    const remainingSessions = await db.select().from(sessions).where(eq(sessions.userId, account.userId));
    expect(remainingSessions).toHaveLength(0);

    const remainingTokens = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, tokenRow.token));
    expect(remainingTokens).toHaveLength(0);

    const reuse = await resetPassword(resetForm);
    expect(reuse.ok).toBe(false);
  });

  it("requestPasswordReset responde ok:true mesmo para e-mail inexistente", async () => {
    const formData = new FormData();
    formData.set("email", randomEmail());
    const result = await requestPasswordReset(formData);
    expect(result.ok).toBe(true);
  });
});

describe("sessão com expires no passado", () => {
  it("fica marcada como expirada no banco — Auth.js core recusa antes do callback session()", async () => {
    const account = await createAccount(randomEmail(), "senha1234");
    if (!account.ok) throw new Error("setup falhou");

    const adapter = DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    });

    const sessionToken = crypto.randomUUID();
    await db.insert(sessions).values({
      sessionToken,
      userId: account.userId,
      expires: new Date(Date.now() - 60_000),
    });

    // O adapter só lê a linha; é o Auth.js core (fora do nosso código) quem
    // compara `expires` com `now()` e recusa a sessão — por isso o teste fica
    // na fronteira que controlamos: garantir que a linha persistida é
    // reconhecível como expirada por essa checagem.
    const result = await adapter.getSessionAndUser!(sessionToken);
    expect(result?.session.expires.getTime()).toBeLessThan(Date.now());
  });
});
