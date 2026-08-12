import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dadosRelatorio } from "@/db/queries/obras";
import { excedidoCents } from "@/lib/calc";
import { formatCents } from "@/lib/money";
import { PainelCards } from "@/components/app/painel-cards";
import { AlertaEstouro } from "@/components/app/alerta-estouro";
import { GraficoCategorias } from "@/components/app/grafico-categorias";

const LABELS: Record<string, string> = {
  material: "Material",
  mao_de_obra: "Mão de Obra",
  taxas: "Taxas",
  mobilia: "Mobília",
};

function formatDataBr(iso: string): string {
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Server Component sem `requireFullAccess()` — o relatório segue a exportação:
 * direito sobre o próprio dado, liberado também em `readonly` (FR-030, FR-031).
 */
export default async function RelatorioObraPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const dados = await dadosRelatorio(session.user.id, id);
  if (!dados) notFound();

  const { obra, totais, porCategoria, lancamentos } = dados;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Relatório — {obra.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Gerado em {new Date().toLocaleDateString("pt-BR")} · Orçamento teto {formatCents(obra.orcamentoTetoCents)}
        </p>
      </div>

      <AlertaEstouro
        excedidoCents={excedidoCents({ orcamentoTetoCents: obra.orcamentoTetoCents, totalPrevistoCents: totais.totalPrevistoCents })}
      />

      <PainelCards
        orcamentoTetoCents={obra.orcamentoTetoCents}
        reservaPct={Number(obra.reservaPct)}
        totalPrevistoCents={totais.totalPrevistoCents}
        totalPagoCents={totais.totalPagoCents}
      />

      <div className="print:break-inside-avoid">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Por categoria</h2>
        <GraficoCategorias dados={porCategoria} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Lançamentos</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2">Data</th>
              <th className="py-1 pr-2">Categoria</th>
              <th className="py-1 pr-2">Item</th>
              <th className="py-1 pr-2 text-right">Previsto</th>
              <th className="py-1 text-right">Pago</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id} className="border-b print:break-inside-avoid">
                <td className="py-1 pr-2">{formatDataBr(l.data)}</td>
                <td className="py-1 pr-2">{LABELS[l.categoria] ?? l.categoria}</td>
                <td className="py-1 pr-2">{l.item}</td>
                <td className="py-1 pr-2 text-right">{formatCents(l.previstoCents)}</td>
                <td className="py-1 text-right">{formatCents(l.pagoCents)}</td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  Nenhum lançamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
