import { describe, expect, it } from "vitest";
import {
  diferencaCents,
  excedidoCents,
  pctConsumido,
  reservaCents,
  saldoCents,
  saldoDisponivelCents,
  statusLancamento,
} from "@/lib/calc";

describe("obra sem lançamentos", () => {
  const obra = { orcamentoTetoCents: 8_500_000, reservaPct: 10, totalPrevistoCents: 0, totalPagoCents: 0 };

  it("totais em zero", () => {
    expect(pctConsumido(obra)).toBe(0);
    expect(excedidoCents(obra)).toBe(0);
    expect(saldoCents(obra)).toBe(8_500_000);
  });

  it("reserva e saldo disponível conforme FR-017", () => {
    expect(reservaCents(obra)).toBe(850_000);
    expect(saldoDisponivelCents(obra)).toBe(8_500_000 - 850_000);
  });
});

describe("statusLancamento", () => {
  it("Pago quando pago == previsto", () => {
    expect(statusLancamento({ pagoCents: 120_000, previstoCents: 120_000 })).toBe("Pago");
    expect(diferencaCents({ pagoCents: 120_000, previstoCents: 120_000 })).toBe(0);
  });

  it("Pendente quando pago < previsto", () => {
    expect(statusLancamento({ pagoCents: 50_000, previstoCents: 120_000 })).toBe("Pendente");
    expect(diferencaCents({ pagoCents: 50_000, previstoCents: 120_000 })).toBe(-70_000);
  });

  it("Pago (com estouro no item) quando pago > previsto", () => {
    expect(statusLancamento({ pagoCents: 150_000, previstoCents: 120_000 })).toBe("Pago");
    expect(diferencaCents({ pagoCents: 150_000, previstoCents: 120_000 })).toBe(30_000);
  });
});

describe("estouro do orçamento teto", () => {
  it("excedidoCents > 0 quando previsto total > orçamento", () => {
    const obra = { orcamentoTetoCents: 100_000, reservaPct: 0, totalPrevistoCents: 130_000, totalPagoCents: 0 };
    expect(excedidoCents(obra)).toBe(30_000);
    expect(saldoCents(obra)).toBe(-30_000);
  });
});

describe("reserva em 0% e 100%", () => {
  it("0% não reduz o saldo disponível", () => {
    const obra = { orcamentoTetoCents: 100_000, reservaPct: 0, totalPrevistoCents: 0, totalPagoCents: 0 };
    expect(reservaCents(obra)).toBe(0);
    expect(saldoDisponivelCents(obra)).toBe(100_000);
  });

  it("100% consome todo o saldo disponível", () => {
    const obra = { orcamentoTetoCents: 100_000, reservaPct: 100, totalPrevistoCents: 0, totalPagoCents: 0 };
    expect(reservaCents(obra)).toBe(100_000);
    expect(saldoDisponivelCents(obra)).toBe(0);
  });
});
