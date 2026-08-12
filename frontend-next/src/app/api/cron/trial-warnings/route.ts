import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { heartbeats, subscriptions, users } from "@/db/schema";
import { sendSuspensaoIminenteEmail, sendTrialExpiringEmail } from "@/lib/email";
import { recordIncident } from "@/lib/incidents";

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const HEARTBEAT_NAME = "trial-warnings";

function diasRestantes(accessUntil: Date): number {
  return Math.ceil((accessUntil.getTime() - Date.now()) / MS_POR_DIA);
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "NAO_AUTENTICADO" }, { status: 401 });
  }

  try {
    let trialAvisados = 0;
    const trialCandidatos = await db
      .select({ userId: subscriptions.userId, accessUntil: subscriptions.accessUntil, email: users.email })
      .from(subscriptions)
      .innerJoin(users, eq(users.id, subscriptions.userId))
      .where(and(eq(subscriptions.status, "trialing"), isNull(subscriptions.trialWarnedAt)));

    for (const row of trialCandidatos) {
      const dias = diasRestantes(row.accessUntil);
      if (dias === 3 || dias === 1) {
        await sendTrialExpiringEmail(row.email, dias);
        await db.update(subscriptions).set({ trialWarnedAt: new Date() }).where(eq(subscriptions.userId, row.userId));
        trialAvisados++;
      }
    }

    let suspensaoAvisados = 0;
    const suspensaoCandidatos = await db
      .select({ userId: subscriptions.userId, accessUntil: subscriptions.accessUntil, email: users.email })
      .from(subscriptions)
      .innerJoin(users, eq(users.id, subscriptions.userId))
      .where(and(eq(subscriptions.status, "past_due"), isNull(subscriptions.suspensaoAvisadaEm)));

    for (const row of suspensaoCandidatos) {
      if (diasRestantes(row.accessUntil) === 2) {
        await sendSuspensaoIminenteEmail(row.email);
        await db
          .update(subscriptions)
          .set({ suspensaoAvisadaEm: new Date() })
          .where(eq(subscriptions.userId, row.userId));
        suspensaoAvisados++;
      }
    }

    await db
      .insert(heartbeats)
      .values({ name: HEARTBEAT_NAME, lastRunAt: new Date() })
      .onConflictDoUpdate({ target: heartbeats.name, set: { lastRunAt: new Date() } });

    return NextResponse.json({ trialAvisados, suspensaoAvisados });
  } catch (error) {
    await recordIncident("cron_failed", "/api/cron/trial-warnings", error);
    return NextResponse.json({ error: "FALHA_INTERNA" }, { status: 500 });
  }
}
