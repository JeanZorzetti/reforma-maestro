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
      question: "Serve para pequenas reformas de apartamento?",
      answer: "Sim, a planilha é 100% adaptável para desde a troca de um piso até a construção de uma casa do zero. Você ajusta as linhas conforme a complexidade do seu projeto."
    },
    {
      question: "Preciso saber Excel avançado?",
      answer: "Não. A planilha é travada para evitar erros. Você só preenche os campos em branco e as fórmulas fazem a mágica. É extremamente intuitiva e vem com instruções claras."
    },
    {
      question: "Funciona no celular?",
      answer: "Sim, através do aplicativo Google Sheets ou Excel Mobile. Você pode consultar e atualizar seus dados de qualquer lugar, mantendo o controle da obra na palma da sua mão."
    },
    {
      question: "A planilha inclui todos os tipos de obra?",
      answer: "Sim! A planilha contempla todos os principais serviços de construção e reforma: alvenaria, revestimentos, instalações elétricas e hidráulicas, pintura, acabamentos e muito mais."
    },
    {
      question: "Vou receber atualizações?",
      answer: "Sim! Com o pagamento único você recebe acesso vitalício e todas as atualizações futuras da planilha, incluindo novos recursos e melhorias baseadas no feedback dos usuários."
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
              Tire suas dúvidas sobre a planilha
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
