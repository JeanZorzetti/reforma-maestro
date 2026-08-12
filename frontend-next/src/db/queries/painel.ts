import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { categoriaEnum, lancamentos, obras } from "@/db/schema";

/** Datas ISO (`YYYY-MM-DD`); ausentes ⇒ sem filtro de período. */
export interface Periodo {
  de?: string;
  ate?: string;
}

function condicoesPeriodo(periodo?: Periodo) {
  const conditions = [];
  if (periodo?.de) conditions.push(gte(lancamentos.data, periodo.de));
  if (periodo?.ate) conditions.push(lte(lancamentos.data, periodo.ate));
  return conditions;
}

export interface PainelTotais {
  totalPrevistoCents: number;
  totalPagoCents: number;
}

/** Totais agregados em SQL — nenhum lançamento trafega até o cliente (R12, SC-009). */
export async function getPainelTotais(userId: string, obraId: string, periodo?: Periodo): Promise<PainelTotais> {
  const [row] = await db
    .select({
      totalPrevistoCents: sql<number>`coalesce(sum(${lancamentos.previstoCents}), 0)::int`,
      totalPagoCents: sql<number>`coalesce(sum(${lancamentos.pagoCents}), 0)::int`,
    })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.obraId, obraId), eq(obras.userId, userId), ...condicoesPeriodo(periodo)));

  return row ?? { totalPrevistoCents: 0, totalPagoCents: 0 };
}

export interface PainelPorCategoria {
  categoria: (typeof categoriaEnum.enumValues)[number];
  totalPrevistoCents: number;
  totalPagoCents: number;
}

export async function getPainelPorCategoria(
  userId: string,
  obraId: string,
  periodo?: Periodo,
): Promise<PainelPorCategoria[]> {
  return db
    .select({
      categoria: lancamentos.categoria,
      totalPrevistoCents: sql<number>`coalesce(sum(${lancamentos.previstoCents}), 0)::int`,
      totalPagoCents: sql<number>`coalesce(sum(${lancamentos.pagoCents}), 0)::int`,
    })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.obraId, obraId), eq(obras.userId, userId), ...condicoesPeriodo(periodo)))
    .groupBy(lancamentos.categoria);
}

export interface EvolucaoMes {
  mes: string; // 'YYYY-MM'
  pagoAcumulado: number;
  previstoAcumulado: number;
}

/**
 * Evolução mensal acumulada do consumo: `pagoAcumulado` só soma lançamentos com
 * `data <= hoje` (o que já saiu do bolso); `previstoAcumulado` soma tudo, inclusive
 * datas futuras (o que está programado). Menos de 2 meses distintos ⇒ `[]` (FR-025).
 */
export async function evolucaoConsumo(userId: string, obraId: string): Promise<EvolucaoMes[]> {
  const rows = await db.execute(sql`
    with por_mes as (
      select
        to_char(date_trunc('month', ${lancamentos.data}), 'YYYY-MM') as mes,
        sum(${lancamentos.pagoCents}) filter (where ${lancamentos.data} <= current_date) as pago_mes,
        sum(${lancamentos.previstoCents}) as previsto_mes
      from ${lancamentos}
      inner join ${obras} on ${obras.id} = ${lancamentos.obraId}
      where ${lancamentos.obraId} = ${obraId} and ${obras.userId} = ${userId}
      group by 1
    )
    select
      mes,
      sum(coalesce(pago_mes, 0)) over (order by mes)::int as pago_acumulado,
      sum(previsto_mes) over (order by mes)::int as previsto_acumulado
    from por_mes
    order by mes
  `);

  const linhas = rows as unknown as { mes: string; pago_acumulado: number; previsto_acumulado: number }[];
  if (linhas.length < 2) return [];

  return linhas.map((r) => ({
    mes: r.mes,
    pagoAcumulado: Number(r.pago_acumulado),
    previstoAcumulado: Number(r.previsto_acumulado),
  }));
}
