import { NextResponse } from "next/server";
import { requireUser } from "@/lib/access";
import { getObra } from "@/db/queries/obras";
import { listLancamentosParaExport } from "@/db/queries/lancamentos";
import { lancamentosParaCsv } from "@/lib/csv";

function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Não exige tier `full` — a exportação é o que `readonly` preserva (FR-026, FR-027). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "NAO_AUTENTICADO", message: "Sessão expirada." }, { status: 401 });
  }

  const { id } = await params;
  const obra = await getObra(user.id, id);
  if (!obra) {
    return NextResponse.json({ error: "NAO_ENCONTRADO", message: "Obra não encontrada." }, { status: 404 });
  }

  const lancamentos = await listLancamentosParaExport(user.id, id);
  const csv = lancamentosParaCsv(lancamentos);
  const data = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="obra-${slugify(obra.nome)}-${data}.csv"`,
    },
  });
}
