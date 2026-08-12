import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { authAttempts } from "@/db/schema";

export type RateScope = "login" | "login_ip" | "reset";

export interface RateResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const LIMITS: Record<RateScope, { max: number; windowSeconds: number }> = {
  login: { max: 10, windowSeconds: 15 * 60 },
  login_ip: { max: 30, windowSeconds: 15 * 60 },
  reset: { max: 5, windowSeconds: 60 * 60 },
};

function keyFor(scope: RateScope, target: string): string {
  if (scope === "login_ip") return `login_ip:${target}`;
  return `${scope}:${createHash("sha256").update(target).digest("hex")}`;
}

/** Consome uma tentativa. UPSERT atômico de janela fixa — sem leitura antes da escrita (contracts/rate-limit.md). */
export async function consumeAttempt(scope: RateScope, target: string): Promise<RateResult> {
  const { max, windowSeconds } = LIMITS[scope];
  const key = keyFor(scope, target);
  const interval = sql.raw(`interval '${windowSeconds} seconds'`);

  const [row] = (await db.execute(sql`
    INSERT INTO auth_attempts (key, window_start, count) VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      window_start = CASE WHEN now() - auth_attempts.window_start > ${interval}
                          THEN now() ELSE auth_attempts.window_start END,
      count        = CASE WHEN now() - auth_attempts.window_start > ${interval}
                          THEN 1 ELSE auth_attempts.count + 1 END
    RETURNING count, window_start
  `)) as unknown as { count: number; window_start: Date }[];

  const allowed = Number(row.count) <= max;
  const elapsedSeconds = (Date.now() - new Date(row.window_start).getTime()) / 1000;
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil(windowSeconds - elapsedSeconds));

  return { allowed, retryAfterSeconds };
}

/** Zera o contador da conta após autenticação bem-sucedida (cenário 6: quem lembrou a senha não é punido). */
export async function clearAttempts(scope: RateScope, target: string): Promise<void> {
  await db.delete(authAttempts).where(eq(authAttempts.key, keyFor(scope, target)));
}
