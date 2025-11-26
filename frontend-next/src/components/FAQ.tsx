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
      question: "Preciso saber fórmulas de Excel?",
      answer: "Zero. O sistema é \"No-Code\". Todas as fórmulas são travadas e automáticas. Você só preenche os campos brancos de entrada de dados."
    },
    {
      question: "Funciona no celular?",
      answer: "Sim. Recomendamos usar o app do Google Sheets (gratuito) para lançar os gastos direto da loja de construção."
    },
    {
      question: "É um software mensal?",
      answer: "Não. É uma compra única (Lifetime). O arquivo é seu para sempre."
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
