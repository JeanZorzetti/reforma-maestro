"use server";

import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { sessions, subscriptions, trialGrants, users, verificationTokens } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { auth, signIn, signOut } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import type { ActionResult } from "./types";

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 14);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function emailHash(email: string) {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

const signUpSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
  nome: z.string().optional(),
});

export type CreateAccountResult =
  | { ok: true; userId: string }
  | { ok: false; error: "VALIDACAO"; fields: Record<string, string> };

/** Transação pura de cadastro (users + trial_grants + subscriptions), sem cookies/redirect — testável isoladamente (T028). */
export async function createAccount(email: string, senha: string, nome?: string): Promise<CreateAccountResult> {
  const parsed = signUpSchema.safeParse({ email, senha, nome });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] = issue.message;
    return { ok: false, error: "VALIDACAO", fields };
  }

  const normalizedEmail = normalizeEmail(parsed.data.email);
  const hash = emailHash(normalizedEmail);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (existing) {
    return { ok: false, error: "VALIDACAO", fields: { email: "Este e-mail já possui conta." } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.senha, 12);

  const userId = await db.transaction(async (tx) => {
    const [grant] = await tx
      .select()
      .from(trialGrants)
      .where(eq(trialGrants.emailHash, hash))
      .limit(1);
    const alreadyGranted = !!grant;

    const [user] = await tx
      .insert(users)
      .values({ email: normalizedEmail, passwordHash, name: parsed.data.nome })
      .returning();

    await tx.insert(trialGrants).values({ emailHash: hash }).onConflictDoNothing();

    const now = new Date();
    const accessUntil = alreadyGranted
      ? now
      : new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await tx.insert(subscriptions).values({
      userId: user.id,
      status: alreadyGranted ? "expired" : "trialing",
      accessUntil,
    });

    return user.id;
  });

  return { ok: true, userId };
}

export async function signUp(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const nome = formData.get("nome") ? String(formData.get("nome")) : undefined;

  const result = await createAccount(email, senha, nome);
  if (!result.ok) return result;

  await signIn("credentials", { email: normalizeEmail(email), senha, redirect: false });
  redirect("/app/obras/nova");
}

export async function login(formData: FormData): Promise<ActionResult | undefined> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  const next = String(formData.get("next") ?? "/app");

  try {
    await signIn("credentials", { email, senha, redirect: false });
  } catch {
    return { ok: false, error: "CREDENCIAIS_INVALIDAS" };
  }

  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const session = await auth();
  if (session?.user?.id) {
    await logAudit(session.user.id, "logout", {});
  }
  await signOut({ redirect: false });
}

const requestResetSchema = z.object({ email: z.string().email() });

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: true, data: undefined };

  const email = normalizeEmail(parsed.data.email);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (user) {
    const token = randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(verificationTokens).values({ identifier: email, token, expires });
    const resetUrl = `${process.env.AUTH_URL}/redefinir-senha/${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  // Nunca revela se o e-mail existe (FR-002).
  return { ok: true, data: undefined };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  senha: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { ok: false, error: "VALIDACAO", fields: { senha: parsed.error.issues[0]?.message ?? "Inválido" } };
  }

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, parsed.data.token))
    .limit(1);

  if (!record || record.expires < new Date()) {
    return { ok: false, error: "TOKEN_INVALIDO" };
  }

  const [user] = await db.select().from(users).where(eq(users.email, record.identifier)).limit(1);
  if (!user) {
    return { ok: false, error: "TOKEN_INVALIDO" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.senha, 12);

  await db.transaction(async (tx) => {
    // passwordChangedAt derruba os JWTs já emitidos (callback jwt em lib/auth.ts).
    await tx.update(users).set({ passwordHash, passwordChangedAt: new Date() }).where(eq(users.id, user.id));
    await tx
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, parsed.data.token));
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
  });

  await logAudit(user.id, "password_reset", {});
  return { ok: true, data: undefined };
}

const deleteAccountSchema = z.object({ senha: z.string().min(1) });

export async function deleteAccount(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "SESSAO_EXPIRADA" };

  const parsed = deleteAccountSchema.safeParse({ senha: formData.get("senha") });
  if (!parsed.success) return { ok: false, error: "VALIDACAO" };

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };

  const valid = await bcrypt.compare(parsed.data.senha, user.passwordHash);
  if (!valid) return { ok: false, error: "SENHA_INCORRETA", fields: { senha: "Senha incorreta." } };

  await db.delete(users).where(eq(users.id, user.id));
  await logAudit(null, "account_deleted", {});

  return { ok: true, data: undefined };
}
