export interface FiltroLancamentos {
  categoria?: string;
  status?: string;
  page?: number;
}

interface NextFiltro {
  categoria?: string | null;
  status?: string | null;
  page?: number | null;
}

/** `null` limpa o filtro; `undefined` mantém o atual (presença explícita da chave, não `??`). */
export function lancamentosUrl(obraId: string, atual: FiltroLancamentos, next: NextFiltro): string {
  const categoria = next.categoria === undefined ? atual.categoria : next.categoria;
  const status = next.status === undefined ? atual.status : next.status;
  const page = next.page === undefined ? atual.page : next.page;

  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (status) params.set("status", status);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return `/app/obras/${obraId}/lancamentos${query ? `?${query}` : ""}`;
}
