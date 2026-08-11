"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-hover p-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                Reforma Maestro
              </h2>
              <p className="text-primary-foreground/90 text-lg">
                Teste grátis por 14 dias, sem cartão de crédito
              </p>
            </div>

            {/* Pricing */}
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="text-5xl md:text-6xl font-bold text-accent mb-2">
                  R$ 47,90
                </div>
                <p className="text-muted-foreground">por mês, cancele quando quiser</p>
              </div>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                {[
                  "Obras e lançamentos ilimitados, acessível do celular",
                  "Painel automático com gráficos e alerta de estouro de orçamento",
                  "Exportação dos dados em planilha a qualquer momento",
                  "14 dias de teste grátis, sem pedir cartão",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                variant="cta"
                size="xl"
                className="w-full"
                asChild
              >
                <a href="/cadastrar">
                  COMEÇAR TESTE GRÁTIS
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
