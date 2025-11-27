import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planilha de Orçamento de Obras e Reformas em Excel - Atualizada 2025",
  description: "Controle total de materiais, mão de obra e cronograma em uma planilha profissional. Não deixe sua obra custar o dobro do planejado. Dashboard automático, cronograma financeiro e integração SINAPI.",
  keywords: "planilha orçamento obras, planilha reforma excel, orçamento construção civil, planilha custos obra, cronograma obra excel, controle financeiro obra",
  authors: [{ name: "Maria Eduarda Zorzetti - Engenheira Mecânica" }],
  openGraph: {
    title: "Planilha de Orçamento de Obras e Reformas em Excel - Atualizada 2025",
    description: "Controle total de materiais, mão de obra e cronograma. Dashboard automático e cronograma financeiro profissional.",
    type: "website",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Planilha de Orçamento de Obras e Reformas em Excel",
    description: "Controle total de materiais, mão de obra e cronograma em uma planilha profissional.",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-94LVZJ1VPS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-94LVZJ1VPS');
          `}
        </Script>
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
