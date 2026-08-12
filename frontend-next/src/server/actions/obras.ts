"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lancamentos, obras } from "@/db/schema";
import { requireFullAccess, requireUser } from "@/lib/access";
import { obraSchema } from "./schemas";
import type { ActionResult } from "./types";

export async function createObra(formData: FormData): Promise<ActionResult<{ obraId: string }>> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const parsed = obraSchema.safeParse({
    nome: formData.get("nome"),
    orcamentoTetoCents: formData.get("orcamentoTeto"),
    reservaPct: formData.get("reservaPct"),
  });
  if (!parsed.success) {
    return { ok: false, error: "VALIDACAO", fields: fieldErrors(parsed.error) };
  }

  const [obra] = await db
    .insert(obras)
    .values({
      userId: user.id,
      nome: parsed.data.nome,
      orcamentoTetoCents: parsed.data.orcamentoTetoCents,
      reservaPct: String(parsed.data.reservaPct),
    })
    .returning({ id: obras.id });

  revalidatePath("/app");
  return { ok: true, data: { obraId: obra.id } };
}

export async function updateObra(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const obraId = String(formData.get("obraId") ?? "");
  const parsed = obraSchema.safeParse({
    nome: formData.get("nome"),
    orcamentoTetoCents: formData.get("orcamentoTeto"),
    reservaPct: formData.get("reservaPct"),
  });
  if (!parsed.success) {
    return { ok: false, error: "VALIDACAO", fields: fieldErrors(parsed.error) };
  }

  const result = await db
    .update(obras)
    .set({
      nome: parsed.data.nome,
      orcamentoTetoCents: parsed.data.orcamentoTetoCents,
      reservaPct: String(parsed.data.reservaPct),
      updatedAt: new Date(),
    })
    .where(and(eq(obras.id, obraId), eq(obras.userId, user.id)))
    .returning({ id: obras.id });

  if (result.length === 0) return { ok: false, error: "NAO_ENCONTRADO" };

  revalidatePath(`/app/obras/${obraId}`);
  return { ok: true, data: undefined };
}

/**
 * Núcleo puro (userId direto, sem `revalidatePath`) — nunca toca `subscriptions`,
 * por isso não altera acesso (FR-028). Testável sem request scope (T048).
 */
async function setArquivada(userId: string, obraId: string, arquivada: boolean): Promise<ActionResult> {
  const result = await db
    .update(obras)
    .set({ arquivadaEm: arquivada ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(obras.id, obraId), eq(obras.userId, userId)))
    .returning({ id: obras.id });

  if (result.length === 0) return { ok: false, error: "NAO_ENCONTRADO" };
  return { ok: true, data: undefined };
}

export async function arquivarObraCore(userId: string, obraId: string): Promise<ActionResult> {
  return setArquivada(userId, obraId, true);
}
export async function desarquivarObraCore(userId: string, obraId: string): Promise<ActionResult> {
  return setArquivada(userId, obraId, false);
}

export async function arquivarObra(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };
  const result = await arquivarObraCore(user.id, String(formData.get("obraId") ?? ""));
  if (result.ok) revalidatePath("/app");
  return result;
}

export async function desarquivarObra(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };
  const result = await desarquivarObraCore(user.id, String(formData.get("obraId") ?? ""));
  if (result.ok) revalidatePath("/app");
  return result;
}

export async function deleteObra(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const obraId = String(formData.get("obraId") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  const [obra] = await db
    .select({ nome: obras.nome })
    .from(obras)
    .where(and(eq(obras.id, obraId), eq(obras.userId, user.id)))
    .limit(1);
  if (!obra) return { ok: false, error: "NAO_ENCONTRADO" };

  if (confirmacao !== obra.nome) {
    return { ok: false, error: "CONFIRMACAO_INVALIDA", fields: { confirmacao: "Digite o nome da obra para confirmar." } };
  }

  await db.delete(obras).where(and(eq(obras.id, obraId), eq(obras.userId, user.id)));

  revalidatePath("/app");
  return { ok: true, data: undefined };
}

/** Obra com lançamentos ilustrativos para o caminho guiado (FR-013, FR-014). Idempotente por usuário. */
export async function criarObraExemplo(): Promise<ActionResult<{ obraId: string }>> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };

  const [existing] = await db
    .select({ id: obras.id })
    .from(obras)
    .where(and(eq(obras.userId, user.id), eq(obras.exemplo, true)))
    .limit(1);
  if (existing) return { ok: true, data: { obraId: existing.id } };

  function dataIso(offsetDias: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDias);
    return d.toISOString().slice(0, 10);
  }

  const obraId = await db.transaction(async (tx) => {
    const [obra] = await tx
      .insert(obras)
      .values({
        userId: user.id,
        nome: "Reforma de exemplo",
        orcamentoTetoCents: 5_000_000,
        reservaPct: "10",
        exemplo: true,
      })
      .returning({ id: obras.id });

    await tx.insert(lancamentos).values([
      {
        obraId: obra.id,
        data: dataIso(-20),
        categoria: "material",
        item: "Cimento e areia",
        fornecedor: "Depósito Central",
        previstoCents: 180_000,
        pagoCents: 180_000,
      },
      {
        obraId: obra.id,
        data: dataIso(-10),
        categoria: "mao_de_obra",
        item: "Pedreiro — semana 1",
        previstoCents: 120_000,
        pagoCents: 120_000,
      },
      {
        obraId: obra.id,
        data: dataIso(-3),
        categoria: "taxas",
        item: "Alvará de reforma",
        fornecedor: "Prefeitura",
        previstoCents: 35_000,
        pagoCents: 35_000,
      },
      {
        obraId: obra.id,
        data: dataIso(5),
        categoria: "mobilia",
        item: "Armários planejados",
        fornecedor: "Marcenaria Ipê",
        previstoCents: 450_000,
        pagoCents: 0,
      },
    ]);

    return obra.id;
  });

  return { ok: true, data: { obraId } };
}

export async function countLancamentos(userId: string, obraId: string): Promise<number> {
  const rows = await db
    .select({ id: lancamentos.id })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.obraId, obraId), eq(obras.userId, userId)));
  return rows.length;
}

function fieldErrors(error: import("zod").ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[String(issue.path[0])] = issue.message;
  return fields;
}
