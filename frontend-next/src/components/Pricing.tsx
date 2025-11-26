"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, Clock } from "lucide-react";

export const Pricing = () => {
  const handlePurchase = () => {
    // This would connect to your payment processor
    alert("Redirecionando para o checkout...");
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-hover p-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                Oferta Especial
              </h2>
              <p className="text-primary-foreground/90 text-lg">
                Investimento único para controle completo
              </p>
            </div>

            {/* Pricing */}
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-2xl text-muted-foreground line-through">R$ 97,00</span>
                  <span className="bg-success text-success-foreground px-4 py-1 rounded-full text-sm font-bold">
                    Oferta de Lançamento
                  </span>
                </div>
                <div className="text-5xl md:text-6xl font-bold text-accent mb-2">
                  R$ 47,90
                </div>
                <p className="text-muted-foreground">Acesso Vitalício • Pagamento Único</p>
              </div>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                {[
                  "Planilha completa com todas as abas e funcionalidades",
                  "Dashboard automático com gráficos e análises",
                  "Cronograma físico-financeiro profissional",
                  "Integração com tabela SINAPI atualizada",
                  "Instruções passo a passo para uso imediato",
                  "Atualizações gratuitas para sempre"
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
                className="w-full mb-6"
                onClick={handlePurchase}
              >
                GARANTIR MEU SISTEMA AGORA
              </Button>

              {/* Guarantee */}
              <div className="bg-success/10 border border-success/20 rounded-lg p-6 flex items-start gap-4">
                <Shield className="h-8 w-8 text-success flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-success" />
                    Garantia de Lógica
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Se a planilha não organizar suas contas em 7 dias, devolvemos 100% do valor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
