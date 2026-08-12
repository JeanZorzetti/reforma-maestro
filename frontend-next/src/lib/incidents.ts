import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { incidents } from "@/db/schema";
import { FORBIDDEN_KEYS } from "@/lib/audit";
import { sendIncidentEmail } from "@/lib/email";

export type IncidentKind = "server_error" | "webhook_failed" | "cron_failed" | "cron_missing";

const SILENT_WINDOW_MS = 30 * 60 * 1000;

/** UUID → '?', sequência de dígitos → '?' — agrupa ocorrências da mesma falha com IDs/contadores diferentes. */
export function normalize(message: string): string {
  return message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "?")
    .replace(/\d+/g, "?");
}

export function fingerprint(kind: IncidentKind, route: string, message: string): string {
  return createHash("sha256").update(kind + route + normalize(message)).digest("hex");
}

/**
 * Ponto único de captura e notificação de incidente. Nunca lança — está sempre
 * num caminho que já falhou. A única exceção é `detail` violando FORBIDDEN_KEYS
 * fora de produção, para pegar vazamento antes de ir ao ar.
 */
export async function recordIncident(
  kind: IncidentKind,
  route: string,
  error: unknown,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const forbiddenKey = Object.keys(detail).find((key) =>
    FORBIDDEN_KEYS.some((forbidden) => key.toLowerCase().includes(forbidden)),
  );
  if (forbiddenKey && process.env.NODE_ENV !== "production") {
    throw new Error(`recordIncident: campo sensível "${forbiddenKey}" não pode ir para incidents.detail`);
  }
  const safeDetail = forbiddenKey
    ? Object.fromEntries(Object.entries(detail).filter(([key]) => key !== forbiddenKey))
    : detail;

  try {
    const message = String(error instanceof Error ? error.message : error).slice(0, 2000);
    const fp = fingerprint(kind, route, message);

    const [row] = await db
      .insert(incidents)
      .values({ fingerprint: fp, kind, route, message, detail: safeDetail })
      .onConflictDoUpdate({
        target: incidents.fingerprint,
        set: { count: sql`${incidents.count} + 1`, lastSeenAt: sql`now()` },
      })
      .returning();

    const shouldNotify =
      row.notifiedAt === null || Date.now() - row.notifiedAt.getTime() > SILENT_WINDOW_MS;
    if (!shouldNotify) return;

    try {
      const userId = typeof safeDetail.userId === "string" ? safeDetail.userId : undefined;
      await sendIncidentEmail({
        kind: row.kind,
        route: row.route,
        message: row.message,
        count: row.count,
        firstSeenAt: row.firstSeenAt,
        lastSeenAt: row.lastSeenAt,
        userId,
      });
      await db.update(incidents).set({ notifiedAt: new Date() }).where(eq(incidents.fingerprint, fp));
    } catch (emailError) {
      console.error("recordIncident: falha ao enviar e-mail de alerta", emailError);
    }
  } catch (err) {
    console.error("recordIncident falhou", err);
  }
}
