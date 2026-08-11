import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categoriaEnum, lancamentos, obras } from "@/db/schema";

export interface PainelTotais {
  totalPrevistoCents: number;
  totalPagoCents: number;
}

/** Totais agregados em SQL — nenhum lançamento trafega até o cliente (R12, SC-009). */
export async function getPainelTotais(userId: string, obraId: string): Promise<PainelTotais> {
  const [row] = await db
    .select({
      totalPrevistoCents: sql<number>`coalesce(sum(${lancamentos.previstoCents}), 0)::int`,
      totalPagoCents: sql<number>`coalesce(sum(${lancamentos.pagoCents}), 0)::int`,
    })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.obraId, obraId), eq(obras.userId, userId)));

  return row ?? { totalPrevistoCents: 0, totalPagoCents: 0 };
}

export interface PainelPorCategoria {
  categoria: (typeof categoriaEnum.enumValues)[number];
  totalPrevistoCents: number;
  totalPagoCents: number;
}

export async function getPainelPorCategoria(userId: string, obraId: string): Promise<PainelPorCategoria[]> {
  return db
    .select({
      categoria: lancamentos.categoria,
      totalPrevistoCents: sql<number>`coalesce(sum(${lancamentos.previstoCents}), 0)::int`,
      totalPagoCents: sql<number>`coalesce(sum(${lancamentos.pagoCents}), 0)::int`,
    })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.obraId, obraId), eq(obras.userId, userId)))
    .groupBy(lancamentos.categoria);
}
