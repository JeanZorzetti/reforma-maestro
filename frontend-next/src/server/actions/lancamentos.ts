"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lancamentos, obras, parcelamentos } from "@/db/schema";
import { requireFullAccess, requireUser } from "@/lib/access";
import { datasParcelas, distribuirParcelas } from "@/lib/parcelas";
import { lancamentoSchema } from "./schemas";
import type { ActionResult } from "./types";

// ponytail: sem locking otimista entre createLancamento/updateLancamento/deleteLancamento —
// duas edições concorrentes no mesmo lançamento fazem "last write wins" sem aviso.
// Upgrade natural se aparecer colisão real: coluna `version` + WHERE version = X (R13).

function fieldErrors(error: import("zod").ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[String(issue.path[0])] = issue.message;
  return fields;
}

export async function createLancamento(formData: FormData): Promise<ActionResult<{ lancamentoId: string }>> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const obraId = String(formData.get("obraId") ?? "");
  const [obra] = await db
    .select({ id: obras.id })
    .from(obras)
    .where(and(eq(obras.id, obraId), eq(obras.userId, user.id)))
    .limit(1);
  if (!obra) return { ok: false, error: "NAO_ENCONTRADO" };

  const parsed = lancamentoSchema.safeParse({
    data: formData.get("data"),
    categoria: formData.get("categoria"),
    item: formData.get("item"),
    fornecedor: formData.get("fornecedor") ?? undefined,
    previstoCents: formData.get("previsto"),
    pagoCents: formData.get("pago") ?? undefined,
    parcelas: formData.get("parcelas") ?? undefined,
    periodicidade: formData.get("periodicidade") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "VALIDACAO", fields: fieldErrors(parsed.error) };

  if (parsed.data.parcelas && parsed.data.periodicidade) {
    const { parcelas: n, periodicidade, previstoCents, categoria, item, fornecedor, pagoCents } = parsed.data;
    const fatias = distribuirParcelas(previstoCents, n);
    const datas = datasParcelas(new Date(`${parsed.data.data}T00:00:00`), n, periodicidade);

    const lancamentoId = await db.transaction(async (tx) => {
      const [serie] = await tx
        .insert(parcelamentos)
        .values({ obraId, totalCents: previstoCents, parcelas: n, periodicidade })
        .returning({ id: parcelamentos.id });

      const rows = await tx
        .insert(lancamentos)
        .values(
          fatias.map((cents, i) => ({
            obraId,
            data: datas[i].toISOString().slice(0, 10),
            categoria,
            item,
            fornecedor,
            previstoCents: cents,
            pagoCents: i === 0 ? (pagoCents ?? 0) : 0,
            parcelamentoId: serie.id,
            parcelaNum: i + 1,
          })),
        )
        .returning({ id: lancamentos.id });

      return rows[0].id;
    });

    revalidatePath(`/app/obras/${obraId}`);
    return { ok: true, data: { lancamentoId } };
  }

  const [lancamento] = await db
    .insert(lancamentos)
    .values({
      obraId,
      data: parsed.data.data,
      categoria: parsed.data.categoria,
      item: parsed.data.item,
      fornecedor: parsed.data.fornecedor,
      previstoCents: parsed.data.previstoCents,
      pagoCents: parsed.data.pagoCents ?? 0,
    })
    .returning({ id: lancamentos.id });

  revalidatePath(`/app/obras/${obraId}`);
  return { ok: true, data: { lancamentoId: lancamento.id } };
}

export async function updateLancamento(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const lancamentoId = String(formData.get("lancamentoId") ?? "");

  const [owned] = await db
    .select({ obraId: lancamentos.obraId })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.id, lancamentoId), eq(obras.userId, user.id)))
    .limit(1);
  if (!owned) return { ok: false, error: "NAO_ENCONTRADO" };

  const parsed = lancamentoSchema.safeParse({
    data: formData.get("data"),
    categoria: formData.get("categoria"),
    item: formData.get("item"),
    fornecedor: formData.get("fornecedor") ?? undefined,
    previstoCents: formData.get("previsto"),
    pagoCents: formData.get("pago") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "VALIDACAO", fields: fieldErrors(parsed.error) };

  await db
    .update(lancamentos)
    .set({
      data: parsed.data.data,
      categoria: parsed.data.categoria,
      item: parsed.data.item,
      fornecedor: parsed.data.fornecedor,
      previstoCents: parsed.data.previstoCents,
      pagoCents: parsed.data.pagoCents ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(lancamentos.id, lancamentoId));

  revalidatePath(`/app/obras/${owned.obraId}`);
  return { ok: true, data: undefined };
}

export async function deleteLancamento(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const lancamentoId = String(formData.get("lancamentoId") ?? "");

  const [owned] = await db
    .select({ obraId: lancamentos.obraId })
    .from(lancamentos)
    .innerJoin(obras, eq(obras.id, lancamentos.obraId))
    .where(and(eq(lancamentos.id, lancamentoId), eq(obras.userId, user.id)))
    .limit(1);
  if (!owned) return { ok: false, error: "NAO_ENCONTRADO" };

  await db.delete(lancamentos).where(eq(lancamentos.id, lancamentoId));

  revalidatePath(`/app/obras/${owned.obraId}`);
  return { ok: true, data: undefined };
}

export async function excluirSerieParcelamento(formData: FormData): Promise<ActionResult<{ removidos: number }>> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const parcelamentoId = String(formData.get("parcelamentoId") ?? "");

  const [owned] = await db
    .select({ obraId: parcelamentos.obraId })
    .from(parcelamentos)
    .innerJoin(obras, eq(obras.id, parcelamentos.obraId))
    .where(and(eq(parcelamentos.id, parcelamentoId), eq(obras.userId, user.id)))
    .limit(1);
  if (!owned) return { ok: false, error: "NAO_ENCONTRADO" };

  const removidos = await db.transaction(async (tx) => {
    const rows = await tx
      .delete(lancamentos)
      .where(eq(lancamentos.parcelamentoId, parcelamentoId))
      .returning({ id: lancamentos.id });
    await tx.delete(parcelamentos).where(eq(parcelamentos.id, parcelamentoId));
    return rows.length;
  });

  revalidatePath(`/app/obras/${owned.obraId}`);
  return { ok: true, data: { removidos } };
}
