import { ogImage, ogSize, ogContentType } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Blog do Reforma Maestro";

export default async function Image() {
  return ogImage({
    eyebrow: "Blog",
    title: "Dicas para reformar sem estourar o orçamento",
    description:
      "Tutoriais e alertas práticos para você controlar os gastos da sua obra sem dor de cabeça.",
  });
}
