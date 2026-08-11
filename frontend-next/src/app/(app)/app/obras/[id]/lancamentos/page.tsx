import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getObra } from "@/db/queries/obras";
import { listLancamentos } from "@/db/queries/lancamentos";
import { diferencaCents, statusLancamento } from "@/lib/calc";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LancamentoRowActions } from "@/components/app/lancamento-row-actions";

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

export default async function LancamentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; categoria?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const { page, categoria, status } = await searchParams;

  const obra = await getObra(session.user.id, id);
  if (!obra) notFound();

  const currentPage = Number(page ?? 1) || 1;
  const result = await listLancamentos({
    userId: session.user.id,
    obraId: id,
    page: currentPage,
    categoria: categoria as never,
    status: status as never,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function filterUrl(next: { categoria?: string; status?: string; page?: number }) {
    const params = new URLSearchParams();
    const c = next.categoria ?? categoria;
    const s = next.status ?? status;
    if (c) params.set("categoria", c);
    if (s) params.set("status", s);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    return `/app/obras/${id}/lancamentos${query ? `?${query}` : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Lançamentos — {obra.nome}</h1>
        <Button asChild className="self-start">
          <Link href={`/app/obras/${id}/lancamentos/novo`}>Novo lançamento</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={filterUrl({ categoria: undefined, page: 1 })} className={!categoria ? "font-semibold" : "text-muted-foreground"}>
            Todas as categorias
          </Link>
          {Object.entries(LABELS).map(([value, label]) => (
            <Link
              key={value}
              href={filterUrl({ categoria: value, page: 1 })}
              className={categoria === value ? "font-semibold" : "text-muted-foreground"}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={filterUrl({ status: undefined, page: 1 })} className={!status ? "font-semibold" : "text-muted-foreground"}>
            Todos
          </Link>
          <Link href={filterUrl({ status: "Pago", page: 1 })} className={status === "Pago" ? "font-semibold" : "text-muted-foreground"}>
            Pago
          </Link>
          <Link href={filterUrl({ status: "Pendente", page: 1 })} className={status === "Pendente" ? "font-semibold" : "text-muted-foreground"}>
            Pendente
          </Link>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Previsto</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Diferença</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.items.map((lancamento) => {
            const itemStatus = statusLancamento(lancamento);
            const diferenca = diferencaCents(lancamento);
            return (
              <TableRow key={lancamento.id}>
                <TableCell>{formatDataBr(lancamento.data)}</TableCell>
                <TableCell>{LABELS[lancamento.categoria]}</TableCell>
                <TableCell>{lancamento.item}</TableCell>
                <TableCell>{formatCents(lancamento.previstoCents)}</TableCell>
                <TableCell>{formatCents(lancamento.pagoCents)}</TableCell>
                <TableCell className={diferenca > 0 ? "text-destructive" : ""}>
                  {formatCents(diferenca)}
                </TableCell>
                <TableCell>
                  <Badge variant={itemStatus === "Pago" ? "default" : "secondary"}>{itemStatus}</Badge>
                </TableCell>
                <TableCell>
                  <LancamentoRowActions obraId={id} lancamentoId={lancamento.id} />
                </TableCell>
              </TableRow>
            );
          })}
          {result.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhum lançamento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={filterUrl({ page: p })}
              className={p === currentPage ? "font-semibold underline" : "text-muted-foreground"}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
