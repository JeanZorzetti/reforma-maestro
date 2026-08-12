import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SchemaMarkup } from "@/components/schema-markup";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://orcaobra.roilabs.com.br'),
  // Sem `alternates.canonical` aqui: metadata do root é herdada por toda rota que
  // não sobrescreva, e um canonical fixo em '/' declarava /sobre, /privacidade e
  // todo o blog como duplicatas da home. Cada rota se auto-canonicaliza.
  title: "Reforma Maestro | Controle Financeiro de Obras e Reformas",
  description: "App de controle financeiro para obras e reformas. Cadastre a obra, lance os gastos e acompanhe o orçamento em um painel automático. Teste grátis por 14 dias.",
  keywords: "controle financeiro de obra, app orçamento obra, controle de gastos reforma, orçamento construção civil, painel financeiro obra",
  authors: [{ name: "Maria Eduarda Zorzetti" }],
  openGraph: {
    title: "Reforma Maestro | Controle Financeiro de Obras e Reformas",
    description: "Cadastre a obra, lance os gastos e acompanhe o orçamento em um painel automático. Teste grátis por 14 dias.",
    type: "website",
    url: "https://orcaobra.roilabs.com.br",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reforma Maestro | Controle Financeiro de Obras e Reformas",
    description: "Cadastre a obra, lance os gastos e acompanhe o orçamento em um painel automático.",
    images: ["/og.png"],
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
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
          <SchemaMarkup />
          <Header />
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
