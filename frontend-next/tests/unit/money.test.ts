import { describe, expect, it } from "vitest";
import { formatCents, parseMoneyToCents, sumCents } from "@/lib/money";

describe("parseMoneyToCents", () => {
  it("parseia milhar com centavos", () => {
    expect(parseMoneyToCents("85.000,00")).toBe(8_500_000);
  });

  it("parseia milhar sem centavos", () => {
    expect(parseMoneyToCents("1.200")).toBe(120_000);
  });

  it("parseia centavos pequenos", () => {
    expect(parseMoneyToCents("0,05")).toBe(5);
  });

  it("rejeita entrada inválida", () => {
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("1.2.3,00")).toBeNull();
    expect(parseMoneyToCents("")).toBeNull();
  });
});

describe("sumCents", () => {
  it("soma 500 valores sem erro de ponto flutuante", () => {
    const values = Array.from({ length: 500 }, () => 333);
    expect(sumCents(values)).toBe(500 * 333);
  });
});

describe("formatCents", () => {
  it("formata em BRL pt-BR", () => {
    expect(formatCents(8_500_000)).toBe(formatCents(8_500_000));
    expect(formatCents(500)).toContain("5,00");
  });
});
