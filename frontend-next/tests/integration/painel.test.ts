import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { lancamentos, obras } from "@/db/schema";
import { getPainelPorCategoria, getPainelTotais } from "@/db/queries/painel";
import { createAccount } from "@/server/actions/auth";

async function setupObra() {
  const account = await createAccount(`${crypto.randomUUID()}@teste.com`, "senha1234");
  if (!account.ok) throw new Error("setup falhou");
  const [obra] = await db
    .insert(obras)
    .values({ userId: account.userId, nome: "Obra", orcamentoTetoCents: 10_000_00, reservaPct: "10" })
    .returning();
  return { userId: account.userId, obra };
}

describe("queries agregadas do painel (R12, SC-009)", () => {
  it("obra vazia devolve totais zerados", async () => {
    const { userId, obra } = await setupObra();
    const totais = await getPainelTotais(userId, obra.id);
    expect(totais.totalPrevistoCents).toBe(0);
    expect(totais.totalPagoCents).toBe(0);
    expect(await getPainelPorCategoria(userId, obra.id)).toHaveLength(0);
  });

  it("soma corretamente com múltiplos lançamentos, inclusive pago > previsto", async () => {
    const { userId, obra } = await setupObra();
    await db.insert(lancamentos).values([
      { obraId: obra.id, data: "2026-01-01", categoria: "material", item: "Cimento", previstoCents: 120_000, pagoCents: 120_000 },
      { obraId: obra.id, data: "2026-01-02", categoria: "material", item: "Areia", previstoCents: 50_000, pagoCents: 30_000 },
      { obraId: obra.id, data: "2026-01-03", categoria: "mao_de_obra", item: "Pedreiro", previstoCents: 200_000, pagoCents: 250_000 },
    ]);

    const totais = await getPainelTotais(userId, obra.id);
    expect(totais.totalPrevistoCents).toBe(120_000 + 50_000 + 200_000);
    expect(totais.totalPagoCents).toBe(120_000 + 30_000 + 250_000);

    const porCategoria = await getPainelPorCategoria(userId, obra.id);
    const material = porCategoria.find((c) => c.categoria === "material");
    const maoDeObra = porCategoria.find((c) => c.categoria === "mao_de_obra");
    expect(material?.totalPrevistoCents).toBe(170_000);
    expect(material?.totalPagoCents).toBe(150_000);
    expect(maoDeObra?.totalPrevistoCents).toBe(200_000);
    expect(maoDeObra?.totalPagoCents).toBe(250_000);
  });
});
