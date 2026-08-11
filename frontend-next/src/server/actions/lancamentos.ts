"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lancamentos, obras } from "@/db/schema";
import { requireFullAccess, requireUser } from "@/lib/access";
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
  });
  if (!parsed.success) return { ok: false, error: "VALIDACAO", fields: fieldErrors(parsed.error) };

  const [lancamento] = await db
    .insert(lancamentos)
    .values({
      obraId,
      data: parsed.data.data.toISOString().slice(0, 10),
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
      data: parsed.data.data.toISOString().slice(0, 10),
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
