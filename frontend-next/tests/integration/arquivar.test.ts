import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { obras } from "@/db/schema";
import { getAccess } from "@/lib/access";
import { listLancamentosParaExport } from "@/db/queries/lancamentos";
import { getObra, listObrasArquivadas } from "@/db/queries/obras";
import { createAccount } from "@/server/actions/auth";
import { arquivarObraCore, desarquivarObraCore } from "@/server/actions/obras";

// arquivarObra/desarquivarObra chamam requireUser()/requireFullAccess() (auth()),
// que exigem request scope — testados aqui pelo núcleo puro (userId direto),
// mesmo motivo de createAccount/deleteAccountCore (ver isolamento.test.ts).

async function setup() {
  const email = `${crypto.randomUUID()}@teste.com`;
  const account = await createAccount(email, "senha1234");
  if (!account.ok) throw new Error("setup falhou");
  const [obra] = await db
    .insert(obras)
    .values({ userId: account.userId, nome: "Obra", orcamentoTetoCents: 100_000, reservaPct: "10" })
    .returning();
  return { userId: account.userId, obraId: obra.id };
}

describe("arquivar/desarquivar obra (FR-026, FR-027, FR-028)", () => {
  it("getAccess devolve o mesmo tier antes e depois de arquivar", async () => {
    const { userId, obraId } = await setup();
    const antes = await getAccess(userId);

    await arquivarObraCore(userId, obraId);
    const depois = await getAccess(userId);
    expect(depois.tier).toBe(antes.tier);

    const [row] = await db.select().from(obras).where(eq(obras.id, obraId));
    expect(row.arquivadaEm).not.toBeNull();
  });

  it("obra arquivada continua exportável e some da listagem principal, aparece em arquivadas", async () => {
    const { userId, obraId } = await setup();
    await arquivarObraCore(userId, obraId);

    const exportRows = await listLancamentosParaExport(userId, obraId);
    expect(exportRows).toEqual([]);

    const arquivadas = await listObrasArquivadas(userId);
    expect(arquivadas.map((o) => o.id)).toContain(obraId);
  });

  it("desarquivar limpa arquivada_em", async () => {
    const { userId, obraId } = await setup();
    await arquivarObraCore(userId, obraId);
    await desarquivarObraCore(userId, obraId);

    const obra = await getObra(userId, obraId);
    expect(obra?.arquivadaEm).toBeNull();
  });
});
