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

export async function archiveObra(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "SESSAO_EXPIRADA" };
  if (!(await requireFullAccess(user.id))) return { ok: false, error: "ACESSO_SOMENTE_LEITURA" };

  const obraId = String(formData.get("obraId") ?? "");
  const arquivar = formData.get("arquivar") === "true";

  const result = await db
    .update(obras)
    .set({ arquivadaEm: arquivar ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(obras.id, obraId), eq(obras.userId, user.id)))
    .returning({ id: obras.id });

  if (result.length === 0) return { ok: false, error: "NAO_ENCONTRADO" };

  revalidatePath("/app");
  return { ok: true, data: undefined };
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
