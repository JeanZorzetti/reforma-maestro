import { ogImage, ogSize, ogContentType } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Sobre a Reforma Maestro | Nossa História e Missão";

export default async function Image() {
  return ogImage({
    eyebrow: "Sobre",
    title: "A história por trás do Reforma Maestro",
    description:
      "Como Maria Eduarda Zorzetti criou o Reforma Maestro para controlar obras sem planilhas complexas.",
  });
}
