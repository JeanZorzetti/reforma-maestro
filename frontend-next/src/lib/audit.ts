import { db } from "@/db";
import { auditLog } from "@/db/schema";

export type AuditEvent =
  | "login"
  | "login_failed"
  | "logout"
  | "password_reset"
  | "subscription_changed"
  | "access_denied"
  | "webhook_unmatched"
  | "account_deleted"
  | "rate_limited";

export const FORBIDDEN_KEYS = ["password", "senha", "hash", "token", "chave", "key", "secret"];

/** `detail` nunca recebe senha, hash, token ou chave (FR-030). */
export async function logAudit(
  userId: string | null,
  event: AuditEvent,
  detail: Record<string, unknown>,
) {
  for (const key of Object.keys(detail)) {
    if (FORBIDDEN_KEYS.some((forbidden) => key.toLowerCase().includes(forbidden))) {
      throw new Error(`logAudit: campo sensível "${key}" não pode ir para audit_log`);
    }
  }
  await db.insert(auditLog).values({ userId, event, detail });
}
