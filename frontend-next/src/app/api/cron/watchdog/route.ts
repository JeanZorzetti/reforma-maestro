import { eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { heartbeats, incidents } from "@/db/schema";
import { sendIncidentEmail } from "@/lib/email";
import { recordIncident } from "@/lib/incidents";

export const runtime = "nodejs";

const STALE_THRESHOLD_MS = 26 * 60 * 60 * 1000;
const HEARTBEAT_NAME = "trial-warnings";

/** Dead man's switch de `trial-warnings` (FR-003) + reenvio de alertas perdidos por indisponibilidade do Resend. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "NAO_AUTENTICADO" }, { status: 401 });
  }

  const [heartbeat] = await db.select().from(heartbeats).where(eq(heartbeats.name, HEARTBEAT_NAME));
  const stale = !heartbeat || Date.now() - heartbeat.lastRunAt.getTime() > STALE_THRESHOLD_MS;

  if (stale) {
    await recordIncident(
      "cron_missing",
      "/api/cron/trial-warnings",
      new Error(`heartbeat "${HEARTBEAT_NAME}" não roda há mais de 26h`),
    );
  }

  const pending = await db.select().from(incidents).where(isNull(incidents.notifiedAt));
  for (const incident of pending) {
    const detail = incident.detail as Record<string, unknown>;
    const userId = typeof detail.userId === "string" ? detail.userId : undefined;
    try {
      await sendIncidentEmail({
        kind: incident.kind,
        route: incident.route,
        message: incident.message,
        count: incident.count,
        firstSeenAt: incident.firstSeenAt,
        lastSeenAt: incident.lastSeenAt,
        userId,
      });
      await db.update(incidents).set({ notifiedAt: new Date() }).where(eq(incidents.fingerprint, incident.fingerprint));
    } catch (err) {
      console.error("watchdog: falha ao reenviar incidente", incident.fingerprint, err);
    }
  }

  return NextResponse.json({ ok: true, stale });
}
