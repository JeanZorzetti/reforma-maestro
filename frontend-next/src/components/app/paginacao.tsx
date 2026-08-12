import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      {temAnterior ? (
        <Link href={hrefForPage(page - 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Anterior
        </Link>
      ) : (
        <span aria-disabled className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none text-muted-foreground")}>
          Anterior
        </span>
      )}
      <p className="text-sm text-muted-foreground">
        {inicio}–{fim} de {total}
      </p>
      {temProxima ? (
        <Link href={hrefForPage(page + 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Próxima
        </Link>
      ) : (
        <span aria-disabled className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none text-muted-foreground")}>
          Próxima
        </span>
      )}
    </div>
  );
}
