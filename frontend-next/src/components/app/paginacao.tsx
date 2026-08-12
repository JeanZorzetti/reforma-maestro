import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface PaginacaoProps {
  page: number;
  pageSize: number;
  total: number;
  hrefForPage: (page: number) => string;
}

/** Avançar/voltar + posição no total ("51–100 de 512"), sem enumerar páginas (FR-029). */
export function Paginacao({ page, pageSize, total, hrefForPage }: PaginacaoProps) {
  if (total === 0) return null;

  const inicio = (page - 1) * pageSize + 1;
  const fim = Math.min(page * pageSize, total);
  const temAnterior = page > 1;
  const temProxima = fim < total;

  return (
    <div className="flex items-center justify-between gap-4">
      <Button asChild variant="outline" size="sm" disabled={!temAnterior}>
        {temAnterior ? <Link href={hrefForPage(page - 1)}>Anterior</Link> : <span>Anterior</span>}
      </Button>
      <p className="text-sm text-muted-foreground">
        {inicio}–{fim} de {total}
      </p>
      <Button asChild variant="outline" size="sm" disabled={!temProxima}>
        {temProxima ? <Link href={hrefForPage(page + 1)}>Próxima</Link> : <span>Próxima</span>}
      </Button>
    </div>
  );
}
