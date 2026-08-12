import { describe, expect, it } from "vitest";
import { lancamentosUrl } from "@/lib/lancamentos-url";

describe("lancamentosUrl", () => {
  it("limpa categoria com filtro ativo (next.categoria = null)", () => {
    const url = lancamentosUrl("obra1", { categoria: "material" }, { categoria: null, page: 1 });
    expect(url).toBe("/app/obras/obra1/lancamentos");
  });

  it("mantém status ao trocar categoria", () => {
    const url = lancamentosUrl(
      "obra1",
      { categoria: "material", status: "Pago" },
      { categoria: "taxas", page: 1 },
    );
    expect(url).toBe("/app/obras/obra1/lancamentos?categoria=taxas&status=Pago");
  });

  it("omite page quando 1", () => {
    const url = lancamentosUrl("obra1", { categoria: "material" }, { page: 1 });
    expect(url).toBe("/app/obras/obra1/lancamentos?categoria=material");
  });

  it("inclui page quando maior que 1", () => {
    const url = lancamentosUrl("obra1", {}, { page: 2 });
    expect(url).toBe("/app/obras/obra1/lancamentos?page=2");
  });
});
