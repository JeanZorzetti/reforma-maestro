import { ogImage, ogSize, ogContentType } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Retenção de Dados e Privacidade | Reforma Maestro";

export default async function Image() {
  return ogImage({
    eyebrow: "Privacidade",
    title: "Retenção de dados e privacidade",
    description:
      "Por quanto tempo o Reforma Maestro guarda seus dados e como solicitar a exclusão da sua conta.",
  });
}
