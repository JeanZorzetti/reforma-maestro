import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { evolucaoConsumo } from "@/db/queries/painel";
import { lancamentos, obras, users } from "@/db/schema";

async function setupObra() {
  const [user] = await db
    .insert(users)
    .values({ email: `${crypto.randomUUID()}@teste.com`, passwordHash: "hash" })
    .returning();
  const [obra] = await db
    .insert(obras)
    .values({ userId: user.id, nome: "Obra", orcamentoTetoCents: 1_000_000, reservaPct: "10" })
    .returning();
  return { userId: user.id, obraId: obra.id };
}

function isoMesesAtras(mesesAtras: number, dia = 10): string {
  const d = new Date();
  d.setMonth(d.getMonth() - mesesAtras, dia);
  return d.toISOString().slice(0, 10);
}

describe("evolucaoConsumo", () => {
  it("array vazio com menos de 2 meses distintos", async () => {
    const { userId, obraId } = await setupObra();
    await db.insert(lancamentos).values({
      obraId,
      data: isoMesesAtras(0),
      categoria: "material",
      item: "X",
      previstoCents: 1000,
      pagoCents: 1000,
    });
    expect(await evolucaoConsumo(userId, obraId)).toEqual([]);
  });

  it("acumula por mês, separando pago (data <= hoje) de previsto (tudo)", async () => {
    const { userId, obraId } = await setupObra();
    await db.insert(lancamentos).values([
      { obraId, data: isoMesesAtras(2), categoria: "material", item: "A", previstoCents: 1000, pagoCents: 1000 },
      { obraId, data: isoMesesAtras(1), categoria: "material", item: "B", previstoCents: 2000, pagoCents: 500 },
    ]);
    const evolucao = await evolucaoConsumo(userId, obraId);
    expect(evolucao).toHaveLength(2);
    expect(evolucao[0].pagoAcumulado).toBe(1000);
    expect(evolucao[0].previstoAcumulado).toBe(1000);
    expect(evolucao[1].pagoAcumulado).toBe(1500);
    expect(evolucao[1].previstoAcumulado).toBe(3000);
  });

  it("previstoAcumulado inclui datas futuras; pagoAcumulado não (FR-024)", async () => {
    const { userId, obraId } = await setupObra();
    const futuro = new Date();
    futuro.setMonth(futuro.getMonth() + 1);
    await db.insert(lancamentos).values([
      { obraId, data: isoMesesAtras(1), categoria: "material", item: "A", previstoCents: 1000, pagoCents: 1000 },
      { obraId, data: futuro.toISOString().slice(0, 10), categoria: "material", item: "B", previstoCents: 5000, pagoCents: 0 },
    ]);
    const evolucao = await evolucaoConsumo(userId, obraId);
    expect(evolucao.at(-1)?.previstoAcumulado).toBe(6000);
    expect(evolucao.at(-1)?.pagoAcumulado).toBe(1000);
  });
});
