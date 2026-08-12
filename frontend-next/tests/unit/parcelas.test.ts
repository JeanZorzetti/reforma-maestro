import { describe, expect, it } from "vitest";
import { distribuirParcelas } from "@/lib/parcelas";
import { sumCents } from "@/lib/money";

describe("distribuirParcelas", () => {
  it("soma exatamente igual ao total em casos não divisíveis", () => {
    const parcelas = distribuirParcelas(1000, 3);
    expect(parcelas).toEqual([334, 333, 333]);
    expect(sumCents(parcelas)).toBe(1000);
  });

  it("distribui o resto a partir da primeira parcela", () => {
    expect(distribuirParcelas(1001, 4)).toEqual([251, 250, 250, 250]);
  });

  it("aceita o limite inferior (2 parcelas)", () => {
    const parcelas = distribuirParcelas(1200, 2);
    expect(parcelas).toEqual([600, 600]);
  });

  it("aceita o limite superior (60 parcelas)", () => {
    const parcelas = distribuirParcelas(6000, 60);
    expect(parcelas).toHaveLength(60);
    expect(sumCents(parcelas)).toBe(6000);
  });

  it("rejeita menos de 2 parcelas", () => {
    expect(() => distribuirParcelas(1000, 1)).toThrow();
  });

  it("rejeita mais de 60 parcelas", () => {
    expect(() => distribuirParcelas(1000, 61)).toThrow();
  });
});
