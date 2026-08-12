import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { obras } from "@/db/schema";
import { listLancamentosParaExport } from "@/db/queries/lancamentos";
import { getPainelPorCategoria, getPainelTotais } from "@/db/queries/painel";

export async function listObras(userId: string) {
  return db
    .select()
    .from(obras)
    .where(and(eq(obras.userId, userId), isNull(obras.arquivadaEm)));
}

/** Dados do relatório apresentável (FR-030) — reusa as agregações do painel, nenhuma agregação nova. */
export async function dadosRelatorio(userId: string, obraId: string) {
  const obra = await getObra(userId, obraId);
  if (!obra) return null;

  const [totais, porCategoria, lancamentosList] = await Promise.all([
    getPainelTotais(userId, obraId),
    getPainelPorCategoria(userId, obraId),
    listLancamentosParaExport(userId, obraId),
  ]);

  return { obra, totais, porCategoria, lancamentos: lancamentosList };
}

export async function listObrasArquivadas(userId: string) {
  return db
    .select()
    .from(obras)
    .where(and(eq(obras.userId, userId), isNotNull(obras.arquivadaEm)));
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
