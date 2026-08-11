import { describe, expect, it } from "vitest";
import { lancamentosParaCsv } from "@/lib/csv";

describe("lancamentosParaCsv", () => {
  it("começa com o BOM UTF-8", () => {
    const csv = lancamentosParaCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("obra sem lançamentos devolve só o cabeçalho", () => {
    const csv = lancamentosParaCsv([]);
    const linhas = csv.slice(1).split("\r\n");
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toBe(
      "Data;Categoria;Item;Fornecedor;Valor Previsto;Valor Pago;Status;Diferença",
    );
  });

  it("mantém a acentuação de Mão de Obra", () => {
    const csv = lancamentosParaCsv([
      {
        data: "2026-03-10",
        categoria: "mao_de_obra",
        item: "Pedreiro",
        fornecedor: null,
        previstoCents: 100_000,
        pagoCents: 100_000,
      },
    ]);
    expect(csv).toContain("Mão de Obra");
  });

  it("envolve em aspas e escapa item contendo ; e \"", () => {
    const csv = lancamentosParaCsv([
      {
        data: "2026-03-10",
        categoria: "material",
        item: 'Tijolo "6 furos"; lote 10',
        fornecedor: null,
        previstoCents: 50_000,
        pagoCents: 0,
      },
    ]);
    expect(csv).toContain('"Tijolo ""6 furos""; lote 10"');
  });

  it("formata valor negativo de diferença com vírgula decimal", () => {
    const csv = lancamentosParaCsv([
      {
        data: "2026-03-10",
        categoria: "taxas",
        item: "ART",
        fornecedor: null,
        previstoCents: 12_000,
        pagoCents: 5_000,
      },
    ]);
    const linha = csv.slice(1).split("\r\n")[1];
    expect(linha.endsWith(";-70,00")).toBe(true);
  });
});
