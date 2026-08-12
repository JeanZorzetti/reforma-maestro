import { ogImage, ogSize, ogContentType } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Sobre o Reforma Maestro | O que é, para quem é e o que não faz";

export default async function Image() {
  return ogImage({
    eyebrow: "Sobre",
    title: "Controle do dinheiro da obra, não do cronograma",
    description:
      "O que o Reforma Maestro faz, o que ele não faz e para quem foi construído.",
  });
}
