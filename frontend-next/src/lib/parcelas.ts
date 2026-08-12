import { addDays, addMonths, addWeeks } from "date-fns";

export type Periodicidade = "mensal" | "quinzenal" | "semanal";

/** Base `Math.floor(total/n)`, resto de um centavo distribuído a partir da primeira parcela (FR-019). */
export function distribuirParcelas(totalCents: number, parcelas: number): number[] {
  if (!Number.isInteger(parcelas) || parcelas < 2 || parcelas > 60) {
    throw new Error("parcelas deve ser um inteiro entre 2 e 60 (FR-022)");
  }
  const base = Math.floor(totalCents / parcelas);
  const resto = totalCents - base * parcelas;
  return Array.from({ length: parcelas }, (_, i) => base + (i < resto ? 1 : 0));
}

/** Data de cada parcela a partir da primeira, deslocada pela periodicidade. */
export function datasParcelas(dataBase: Date, parcelas: number, periodicidade: Periodicidade): Date[] {
  return Array.from({ length: parcelas }, (_, i) => {
    switch (periodicidade) {
      case "mensal":
        return addMonths(dataBase, i);
      case "quinzenal":
        return addDays(dataBase, i * 15);
      case "semanal":
        return addWeeks(dataBase, i);
    }
  });
}
