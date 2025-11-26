import { AlertTriangle, X } from "lucide-react";

export const Problem = () => {
  const problems = [
    "Comprar material errado ou em excesso",
    "Ficar na mão de pedreiros que pedem dinheiro picado toda semana",
    "Perder o controle do fluxo de caixa e parar a obra na metade"
  ];

  return (
    <section className="py-20 bg-destructive/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <h2 className="text-3xl md:text-4xl font-bold">O Problema</h2>
          </div>
          
          <p className="text-xl md:text-2xl mb-12 text-foreground font-semibold leading-relaxed">
            Você sabia que <span className="text-destructive font-bold">85% das obras no Brasil</span> estouram 
            o orçamento inicial em <span className="text-destructive font-bold">pelo menos 30%</span>? O motivo 
            não é o preço do cimento, é a <span className="underline decoration-destructive decoration-2">falta de planejamento</span>.
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
