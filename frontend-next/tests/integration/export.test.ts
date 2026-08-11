import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { lancamentos, obras, subscriptions } from "@/db/schema";
import { getObra } from "@/db/queries/obras";
import { listLancamentosParaExport } from "@/db/queries/lancamentos";
import { lancamentosParaCsv } from "@/lib/csv";
import { createAccount } from "@/server/actions/auth";

// A rota (GET /api/obras/[id]/export) chama requireUser() → auth(), que exige
// request scope e não roda fora de uma requisição real (mesma limitação do
// handoff, T050). O que a rota garante — posse via getObra e ausência de
// checagem de tier — é exercitado aqui diretamente contra a mesma query que
// ela usa por baixo.

async function setupUsuarioComObra() {
  const account = await createAccount(`${crypto.randomUUID()}@teste.com`, "senha1234");
  if (!account.ok) throw new Error("setup falhou");
  const [obra] = await db
    .insert(obras)
    .values({ userId: account.userId, nome: "Obra", orcamentoTetoCents: 100_000, reservaPct: "10" })
    .returning();
  return { userId: account.userId, obra };
}

describe("exportação CSV (FR-026, FR-027, SC-007)", () => {
  it("funciona com assinatura expired — export não exige tier full", async () => {
    const { userId, obra } = await setupUsuarioComObra();
    await db.update(subscriptions).set({ status: "expired" }).where(eq(subscriptions.userId, userId));

    await db.insert(lancamentos).values({
      obraId: obra.id,
      data: "2026-01-01",
      categoria: "material",
      item: "Cimento",
      previstoCents: 120_000,
      pagoCents: 120_000,
    });

    const obraCarregada = await getObra(userId, obra.id);
    expect(obraCarregada).not.toBeNull();

    const itens = await listLancamentosParaExport(userId, obra.id);
    expect(itens).toHaveLength(1);
    expect(lancamentosParaCsv(itens)).toContain("Cimento");
  });

  it("obra de outro usuário retorna null — a rota devolve 404 (FR-029)", async () => {
    const a = await setupUsuarioComObra();
    const b = await setupUsuarioComObra();
    expect(await getObra(b.userId, a.obra.id)).toBeNull();
  });
});
