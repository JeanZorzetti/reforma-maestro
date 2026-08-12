import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getObra } from "@/db/queries/obras";
import { evolucaoConsumo, getPainelPorCategoria, getPainelTotais } from "@/db/queries/painel";
import { excedidoCents } from "@/lib/calc";
import { PainelCards } from "@/components/app/painel-cards";
import { AlertaEstouro } from "@/components/app/alerta-estouro";
import { GraficoCategorias } from "@/components/app/grafico-categorias";
import { GraficoEvolucao } from "@/components/app/grafico-evolucao";
import { ObraArchiveButton } from "@/components/app/obra-archive-button";
import { Button } from "@/components/ui/button";

export default async function PainelObraPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const obra = await getObra(session.user.id, id);
  if (!obra) notFound();

  const [totais, porCategoria, evolucao] = await Promise.all([
    getPainelTotais(session.user.id, id),
    getPainelPorCategoria(session.user.id, id),
    evolucaoConsumo(session.user.id, id),
  ]);

  const orcamentoTetoCents = obra.orcamentoTetoCents;
  const reservaPct = Number(obra.reservaPct);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">{obra.nome}</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/obras/${id}/editar`}>Editar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/app/obras/${id}/lancamentos`}>Lançamentos</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/obras/${id}/export`}>Exportar CSV</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/obras/${id}/relatorio`}>Relatório</Link>
          </Button>
          <ObraArchiveButton obraId={id} />
        </div>
      </div>

      <AlertaEstouro excedidoCents={excedidoCents({ orcamentoTetoCents, totalPrevistoCents: totais.totalPrevistoCents })} />

      <PainelCards
        orcamentoTetoCents={orcamentoTetoCents}
        reservaPct={reservaPct}
        totalPrevistoCents={totais.totalPrevistoCents}
        totalPagoCents={totais.totalPagoCents}
      />

      <GraficoCategorias dados={porCategoria} />

      <GraficoEvolucao dados={evolucao} orcamentoTetoCents={orcamentoTetoCents} />
    </div>
  );
}
