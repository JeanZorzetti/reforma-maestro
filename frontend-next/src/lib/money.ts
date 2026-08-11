const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** "85.000,00" | "1.200" | "0,05" → centavos. `null` se a entrada não for um valor válido. */
export function parseMoneyToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
