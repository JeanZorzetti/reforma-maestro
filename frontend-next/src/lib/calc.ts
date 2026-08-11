export interface ObraTotais {
  orcamentoTetoCents: number;
  reservaPct: number;
  totalPrevistoCents: number;
  totalPagoCents: number;
}

export function reservaCents(obra: Pick<ObraTotais, "orcamentoTetoCents" | "reservaPct">): number {
  return Math.round((obra.orcamentoTetoCents * obra.reservaPct) / 100);
}

export function saldoCents(obra: Pick<ObraTotais, "orcamentoTetoCents" | "totalPrevistoCents">): number {
  return obra.orcamentoTetoCents - obra.totalPrevistoCents;
}

export function saldoDisponivelCents(obra: ObraTotais): number {
  return saldoCents(obra) - reservaCents(obra);
}

export function pctConsumido(obra: Pick<ObraTotais, "orcamentoTetoCents" | "totalPrevistoCents">): number {
  if (obra.orcamentoTetoCents === 0) return 0;
  return (obra.totalPrevistoCents / obra.orcamentoTetoCents) * 100;
}

export function excedidoCents(obra: Pick<ObraTotais, "orcamentoTetoCents" | "totalPrevistoCents">): number {
  return Math.max(0, obra.totalPrevistoCents - obra.orcamentoTetoCents);
}

export type StatusLancamento = "Pago" | "Pendente";

export function statusLancamento(lancamento: { pagoCents: number; previstoCents: number }): StatusLancamento {
  return lancamento.pagoCents >= lancamento.previstoCents ? "Pago" : "Pendente";
}

export function diferencaCents(lancamento: { pagoCents: number; previstoCents: number }): number {
  return lancamento.pagoCents - lancamento.previstoCents;
}
