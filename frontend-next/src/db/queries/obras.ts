import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { obras } from "@/db/schema";

export async function listObras(userId: string) {
  return db
    .select()
    .from(obras)
    .where(and(eq(obras.userId, userId), isNull(obras.arquivadaEm)));
}

/** Obra de outro usuário retorna `null` — nunca lança, nunca distingue de "não existe" (FR-029). */
export async function getObra(userId: string, obraId: string) {
  const [obra] = await db
    .select()
    .from(obras)
    .where(and(eq(obras.id, obraId), eq(obras.userId, userId)))
    .limit(1);
  return obra ?? null;
}

/** Obras "reais" (não-exemplo) — indicador de uso para decisões de onboarding (FR-015). */
export async function countObrasReais(userId: string): Promise<number> {
  const rows = await db
    .select({ id: obras.id })
    .from(obras)
    .where(and(eq(obras.userId, userId), isNull(obras.arquivadaEm), eq(obras.exemplo, false)));
  return rows.length;
}
