import { and, desc, eq, getTableColumns, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { categoriaEnum, lancamentos, obras } from "@/db/schema";
import type { Periodo } from "@/db/queries/painel";

const PAGE_SIZE = 50;

export interface ListLancamentosParams {
  userId: string;
  obraId: string;
  page?: number;
  categoria?: (typeof categoriaEnum.enumValues)[number];
  status?: "Pago" | "Pendente";
}

/** Paginado, escopado por join em `obras.user_id` — nunca confia em `obraId` isolado (FR-029). */
export async function listLancamentos({
  userId,
  obraId,
  page = 1,
  categoria,
  status,
}: ListLancamentosParams) {
  const conditions = [eq(lancamentos.obraId, obraId), eq(obras.userId, userId)];
  if (categoria) conditions.push(eq(lancamentos.categoria, categoria));
  if (status === "Pago") conditions.push(sql`${lancamentos.pagoCents} >= ${lancamentos.previstoCents}`);
  if (status === "Pendente") conditions.push(sql`${lancamentos.pagoCents} < ${lancamentos.previstoCents}`);

  const where = and(...conditions);

  const [items, [{ count }]] = await Promise.all([
    db
      .select(getTableColumns(lancamentos))
      .from(lancamentos)
      .innerJoin(obras, eq(obras.id, lancamentos.obraId))
      .where(where)
      .orderBy(desc(lancamentos.data))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(lancamentos)
      .innerJoin(obras, eq(obras.id, lancamentos.obraId))
      .where(where),
  ]);

  return { items, total: count, page, pageSize: PAGE_SIZE };
}

/** Todos os lançamentos da obra, sem paginação — uso da exportação (FR-026) e do relatório. */
export async function listLancamentosParaExport(userId: string, obraId: string, periodo?: Periodo) {
  const conditions = [eq(lancamentos.obraId, obraId), eq(obras.userId, userId)];
  if (periodo?.de) conditions.push(gte(lancamentos.data, periodo.de));
  if (periodo?.ate) conditions.push(lte(lancamentos.data, periodo.ate));

  return db
    .select(getTableColumns(lancamentos))
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(...conditions))
    .orderBy(desc(lancamentos.data));
}

/** Total de lançamentos por série, para a confirmação "isso vai remover N lançamentos" (FR-021) antes de excluir. */
export async function countsByParcelamento(
  userId: string,
  obraId: string,
  parcelamentoIds: string[],
): Promise<Record<string, number>> {
  if (parcelamentoIds.length === 0) return {};
  const rows = await db
    .select({ parcelamentoId: lancamentos.parcelamentoId, count: sql<number>`count(*)::int` })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(
      and(
        eq(lancamentos.obraId, obraId),
        eq(obras.userId, userId),
        inArray(lancamentos.parcelamentoId, parcelamentoIds),
      ),
    )
    .groupBy(lancamentos.parcelamentoId);
  return Object.fromEntries(rows.map((r) => [r.parcelamentoId as string, r.count]));
}

/** Lançamento de outro usuário retorna `null` (FR-029). */
export async function getLancamento(userId: string, lancamentoId: string) {
  const [row] = await db
    .select(getTableColumns(lancamentos))
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.id, lancamentoId), eq(obras.userId, userId)))
    .limit(1);
  return row ?? null;
}
