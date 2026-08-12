import { ogImage, ogSize, ogContentType } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Reforma Maestro | Controle Financeiro de Obras e Reformas";

export default async function Image() {
  return ogImage({
    eyebrow: "Controle Financeiro de Obras",
    title: "Pare de perder dinheiro na reforma",
    description:
      "Cadastre a obra, lance os gastos e acompanhe o orçamento em um painel automático. Teste grátis por 14 dias.",
  });
}
