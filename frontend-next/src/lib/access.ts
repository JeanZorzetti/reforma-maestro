import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { logAudit } from "@/lib/audit";

export type Tier = "full" | "readonly";
export type SubscriptionStatus = (typeof subscriptions.status.enumValues)[number];

export interface Access {
  tier: Tier;
  status: SubscriptionStatus;
  accessUntil: Date;
}

/** Tabela-verdade de R4: tier deriva sempre de status + access_until, nunca do cliente. */
export async function getAccess(userId: string): Promise<Access> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub) {
    return { tier: "readonly", status: "expired", accessUntil: new Date(0) };
  }

  const tier: Tier =
    sub.status !== "expired" && new Date() <= sub.accessUntil ? "full" : "readonly";

  return { tier, status: sub.status, accessUntil: sub.accessUntil };
}

export interface SessionUser {
  id: string;
  email: string;
}

/** Sessão válida no servidor. `null` ⇒ caller devolve `{ ok: false, error: 'SESSAO_EXPIRADA' }`. */
export async function requireUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return { id: session.user.id, email: session.user.email };
}

/** `false` quando o acesso já é uma assinatura ativa — não oferecer checkout. */
export function precisaAssinar(access: Access): boolean {
  return !(access.tier === "full" && access.status === "active");
}

/**
 * `true` ⇒ tier `full`. `false` ⇒ caller devolve `{ ok: false, error: 'ACESSO_SOMENTE_LEITURA' }`
 * (o form deve linkar `/app/assinar`). Toda negação grava `access_denied` em audit_log (FR-030, T064).
 */
export async function requireFullAccess(userId: string): Promise<boolean> {
  const access = await getAccess(userId);
  if (access.tier === "full") return true;
  await logAudit(userId, "access_denied", {});
  return false;
}
