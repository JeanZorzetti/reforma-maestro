import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dadosRelatorio } from "@/db/queries/obras";
import { diferencaCents, excedidoCents, statusLancamento } from "@/lib/calc";
import { formatCents } from "@/lib/money";
import { AlertaEstouro } from "@/components/app/alerta-estouro";
import { PrintButton } from "@/components/app/print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

/** `undefined` quando ausente ou malformada — tratada como filtro não aplicado antes de chegar ao SQL. */
function parseDataIso(valor?: string): string | undefined {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(valor))) return undefined;
  return valor;
}

/**
 * Server Component sem `requireFullAccess()` — o relatório segue a exportação:
 * direito sobre o próprio dado, liberado também em `readonly` (FR-030, FR-031).
 */
export default async function RelatorioObraPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const { de: deRaw, ate: ateRaw } = await searchParams;
  const de = parseDataIso(deRaw);
  const ate = parseDataIso(ateRaw);

  const dados = await dadosRelatorio(session.user.id, id, { de, ate });
  if (!dados) notFound();

  const { obra, totais, porCategoria, lancamentos } = dados;
  const pctTeto = (previstoCents: number) =>
    obra.orcamentoTetoCents === 0 ? 0 : (previstoCents / obra.orcamentoTetoCents) * 100;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Relatório — {obra.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {de || ate ? `Período: ${de ? formatDataBr(de) : "início"} – ${ate ? formatDataBr(ate) : "hoje"} · ` : ""}
            Gerado em {new Date().toLocaleDateString("pt-BR")} · Orçamento teto {formatCents(obra.orcamentoTetoCents)}
          </p>
        </div>
        <PrintButton />
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="space-y-1">
          <Label htmlFor="de">De</Label>
          <Input id="de" type="date" name="de" defaultValue={de} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ate">Até</Label>
          <Input id="ate" type="date" name="ate" defaultValue={ate} />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Aplicar período
        </Button>
      </form>

      <AlertaEstouro
        excedidoCents={excedidoCents({ orcamentoTetoCents: obra.orcamentoTetoCents, totalPrevistoCents: totais.totalPrevistoCents })}
      />

      <div className="print:break-inside-avoid">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Resumo por categoria</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2">Categoria</th>
              <th className="py-1 pr-2 text-right">Previsto</th>
              <th className="py-1 pr-2 text-right">Pago</th>
              <th className="py-1 pr-2 text-right">Diferença</th>
              <th className="py-1 text-right">% teto</th>
            </tr>
          </thead>
          <tbody>
            {porCategoria.map((c) => (
              <tr key={c.categoria} className="border-b">
                <td className="py-1 pr-2">{LABELS[c.categoria] ?? c.categoria}</td>
                <td className="py-1 pr-2 text-right">{formatCents(c.totalPrevistoCents)}</td>
                <td className="py-1 pr-2 text-right">{formatCents(c.totalPagoCents)}</td>
                <td className={`py-1 pr-2 text-right ${diferencaCents({ pagoCents: c.totalPagoCents, previstoCents: c.totalPrevistoCents }) > 0 ? "text-destructive" : ""}`}>
                  {formatCents(diferencaCents({ pagoCents: c.totalPagoCents, previstoCents: c.totalPrevistoCents }))}
                </td>
                <td className="py-1 text-right">{pctTeto(c.totalPrevistoCents).toFixed(0)}%</td>
              </tr>
            ))}
            <tr className="border-t font-semibold">
              <td className="py-1 pr-2">TOTAL</td>
              <td className="py-1 pr-2 text-right">{formatCents(totais.totalPrevistoCents)}</td>
              <td className="py-1 pr-2 text-right">{formatCents(totais.totalPagoCents)}</td>
              <td className={`py-1 pr-2 text-right ${diferencaCents({ pagoCents: totais.totalPagoCents, previstoCents: totais.totalPrevistoCents }) > 0 ? "text-destructive" : ""}`}>
                {formatCents(diferencaCents({ pagoCents: totais.totalPagoCents, previstoCents: totais.totalPrevistoCents }))}
              </td>
              <td className="py-1 text-right">{pctTeto(totais.totalPrevistoCents).toFixed(0)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Lançamentos ({lancamentos.length})</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2">Data</th>
              <th className="py-1 pr-2">Categoria</th>
              <th className="py-1 pr-2">Item</th>
              <th className="py-1 pr-2 text-right">Previsto</th>
              <th className="py-1 pr-2 text-right">Pago</th>
              <th className="py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id} className="border-b print:break-inside-avoid">
                <td className="py-1 pr-2">{formatDataBr(l.data)}</td>
                <td className="py-1 pr-2">{LABELS[l.categoria] ?? l.categoria}</td>
                <td className="py-1 pr-2">{l.item}</td>
                <td className="py-1 pr-2 text-right">{formatCents(l.previstoCents)}</td>
                <td className="py-1 pr-2 text-right">{formatCents(l.pagoCents)}</td>
                <td className="py-1">
                  <Badge variant={statusLancamento(l) === "Pago" ? "default" : "secondary"}>{statusLancamento(l)}</Badge>
                </td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-muted-foreground">
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
