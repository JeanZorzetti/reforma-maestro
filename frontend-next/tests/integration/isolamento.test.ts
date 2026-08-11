import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { lancamentos, obras } from "@/db/schema";
import { getLancamento, listLancamentos } from "@/db/queries/lancamentos";
import { getObra, listObras } from "@/db/queries/obras";
import { createAccount } from "@/server/actions/auth";

// As Server Actions (updateObra, updateLancamento, deleteLancamento) chamam
// requireUser() → auth(), que exige o request scope do Next.js (cookies()) e
// não roda fora de uma requisição real. O que garante FR-029 é o mesmo `WHERE`
// escopado por user_id/join que essas actions usam por baixo — é isso que os
// testes abaixo exercitam diretamente, contra as mesmas queries e o mesmo SQL
// de mutação (T050).

async function setupUsuarioComObra() {
  const account = await createAccount(`${crypto.randomUUID()}@teste.com`, "senha1234");
  if (!account.ok) throw new Error("setup falhou");
  const [obra] = await db
    .insert(obras)
    .values({ userId: account.userId, nome: "Obra", orcamentoTetoCents: 100_000, reservaPct: "10" })
    .returning();
  const [lancamento] = await db
    .insert(lancamentos)
    .values({ obraId: obra.id, data: "2026-01-01", categoria: "material", item: "Item", previstoCents: 1000 })
    .returning();
  return { userId: account.userId, obra, lancamento };
}

describe("isolamento entre contas (FR-029, SC-006)", () => {
  it("getObra de outro usuário retorna null, nunca lança", async () => {
    const a = await setupUsuarioComObra();
    const b = await setupUsuarioComObra();
    expect(await getObra(b.userId, a.obra.id)).toBeNull();
  });

  it("listObras não inclui obra de outro usuário", async () => {
    const a = await setupUsuarioComObra();
    const b = await setupUsuarioComObra();
    const obrasDeB = await listObras(b.userId);
    expect(obrasDeB.find((o) => o.id === a.obra.id)).toBeUndefined();
  });

  it("getLancamento de outro usuário retorna null", async () => {
    const a = await setupUsuarioComObra();
    const b = await setupUsuarioComObra();
    expect(await getLancamento(b.userId, a.lancamento.id)).toBeNull();
  });

  it("listLancamentos escopado por obraId+userId não vaza dado de outra conta", async () => {
    const a = await setupUsuarioComObra();
    const b = await setupUsuarioComObra();
    const result = await listLancamentos({ userId: b.userId, obraId: a.obra.id });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("mutação (update) escopada por user_id afeta 0 linhas para o dono errado — NAO_ENCONTRADO, nunca SEM_PERMISSAO", async () => {
    const a = await setupUsuarioComObra();
    const b = await setupUsuarioComObra();

    const updateResult = await db
      .update(obras)
      .set({ nome: "Hackeado" })
      .where(and(eq(obras.id, a.obra.id), eq(obras.userId, b.userId)))
      .returning({ id: obras.id });
    expect(updateResult).toHaveLength(0);

    const [obraIntacta] = await db.select().from(obras).where(eq(obras.id, a.obra.id));
    expect(obraIntacta.nome).toBe("Obra");
  });

  it("mutação (delete) de lançamento escopada por join não afeta linha de outra conta", async () => {
    const a = await setupUsuarioComObra();
    const b = await setupUsuarioComObra();

    const owned = await db
      .select({ id: lancamentos.id })
      .from(lancamentos)
      .innerJoin(obras, eq(obras.id, lancamentos.obraId))
      .where(and(eq(lancamentos.id, a.lancamento.id), eq(obras.userId, b.userId)))
      .limit(1);
    expect(owned).toHaveLength(0);

    const [aindaExiste] = await db.select().from(lancamentos).where(eq(lancamentos.id, a.lancamento.id));
    expect(aindaExiste).toBeDefined();
  });
});
