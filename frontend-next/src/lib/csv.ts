import { diferencaCents, statusLancamento } from "@/lib/calc";

const CATEGORIA_LABELS: Record<string, string> = {
  material: "Material",
  mao_de_obra: "Mão de Obra",
  taxas: "Taxas",
  mobilia: "Mobília",
};

const HEADER = [
  "Data",
  "Categoria",
  "Item",
  "Fornecedor",
  "Valor Previsto",
  "Valor Pago",
  "Status",
  "Diferença",
];

export interface LancamentoCsvRow {
  data: string; // "YYYY-MM-DD"
  categoria: string;
  item: string;
  fornecedor: string | null;
  previstoCents: number;
  pagoCents: number;
}

function escapeCsvField(value: string): string {
  if (/[;"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDataBr(iso: string): string {
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function formatDecimal(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** BOM UTF-8 + CSV `;` (R11). Obra sem lançamentos devolve só o cabeçalho. */
export function lancamentosParaCsv(lancamentos: LancamentoCsvRow[]): string {
  const linhas = lancamentos.map((l) =>
    [
      formatDataBr(l.data),
      CATEGORIA_LABELS[l.categoria] ?? l.categoria,
      l.item,
      l.fornecedor ?? "",
      formatDecimal(l.previstoCents),
      formatDecimal(l.pagoCents),
      statusLancamento(l),
      formatDecimal(diferencaCents(l)),
    ]
      .map(escapeCsvField)
      .join(";"),
  );

  return "﻿" + [HEADER.join(";"), ...linhas].join("\r\n");
}
