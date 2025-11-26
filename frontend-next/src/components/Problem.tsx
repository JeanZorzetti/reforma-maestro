import { AlertTriangle, X } from "lucide-react";

export const Problem = () => {
  const problems = [
    "Perder o controle do quanto já pagou e quanto falta pagar",
    "Misturar dinheiro pessoal com dinheiro da obra",
    "Descobrir que o orçamento estourou só quando o cartão de crédito é recusado"
  ];

  return (
    <section className="py-20 bg-destructive/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <h2 className="text-3xl md:text-4xl font-bold">O Problema</h2>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
            "O problema não é o pedreiro, é o Fluxo de Caixa."
          </h3>

          <p className="text-xl mb-12 text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            A maioria das obras para na metade não por falta de material, mas porque o dinheiro foi mal gerenciado.
            Sem um sistema centralizado, você vira refém de notas fiscais soltas e contas de cabeça.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <div
                key={index}
                className="bg-background p-6 rounded-lg border-2 border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <X className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-left text-foreground font-medium">{problem}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
