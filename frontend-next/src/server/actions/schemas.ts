import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";

const moneyField = (errorMessage: string) =>
  z.string().transform((value, ctx) => {
    const cents = parseMoneyToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: errorMessage });
      return z.NEVER;
    }
    return cents;
  });

export const obraSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "O nome da obra é obrigatório.")
    .max(120, "O nome da obra pode ter no máximo 120 caracteres."),
  orcamentoTetoCents: moneyField("O orçamento teto precisa ser maior que zero.").refine(
    (cents) => cents > 0,
    "O orçamento teto precisa ser maior que zero.",
  ),
  reservaPct: z
    .string()
    .transform((value) => Number(value.replace(",", ".")))
    .refine(
      (value) => Number.isFinite(value) && value >= 0 && value <= 100,
      "O fundo de reserva precisa estar entre 0% e 100%.",
    ),
});

export const categoriaValues = ["material", "mao_de_obra", "taxas", "mobilia"] as const;

function parseDataBr(value: string, ctx: z.RefinementCtx): Date {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    ctx.addIssue({ code: "custom", message: "Data inválida, use dd/MM/yyyy." });
    return z.NEVER;
  }
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: "custom", message: "Data inválida, use dd/MM/yyyy." });
    return z.NEVER;
  }
  return date;
}

export const lancamentoSchema = z.object({
  data: z.string().transform(parseDataBr),
  categoria: z.enum(categoriaValues, { message: "Categoria inválida." }),
  item: z.string().trim().min(1, "O item é obrigatório.").max(200, "O item pode ter no máximo 200 caracteres."),
  fornecedor: z
    .string()
    .trim()
    .max(200, "O fornecedor pode ter no máximo 200 caracteres.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  previstoCents: moneyField("O valor previsto precisa ser um número válido.").refine(
    (cents) => cents >= 0,
    "O valor previsto não pode ser negativo.",
  ),
  pagoCents: moneyField("O valor pago precisa ser um número válido.")
    .refine((cents) => cents >= 0, "O valor pago não pode ser negativo.")
    .optional()
    .or(z.literal("").transform(() => 0)),
});
