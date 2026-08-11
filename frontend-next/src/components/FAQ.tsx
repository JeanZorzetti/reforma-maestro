import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const FAQ = () => {
  const faqs = [
    {
      question: "Serve para quem vai reformar apartamento pequeno?",
      answer: "Sim. O sistema se adapta ao tamanho do seu orçamento, seja R$ 5.000 ou R$ 500.000."
    },
    {
      question: "Preciso instalar alguma coisa ou saber usar planilha?",
      answer: "Não. É um app que roda direto no navegador. Você cria a conta, cadastra a obra e lança os gastos — o cálculo é automático."
    },
    {
      question: "Funciona no celular?",
      answer: "Sim. O app é acessível pelo navegador do celular, para lançar os gastos direto da loja de construção."
    },
    {
      question: "Como funciona o pagamento?",
      answer: "Assinatura mensal de R$ 47,90, com 14 dias de teste grátis sem pedir cartão. Você pode cancelar quando quiser."
    },
    {
      question: "Se eu cancelar, perco meus dados?",
      answer: "Não. Você pode exportar todos os lançamentos em planilha a qualquer momento, mesmo depois de cancelar."
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Perguntas Frequentes
              </h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre o sistema
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
