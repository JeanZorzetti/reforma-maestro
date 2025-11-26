import { CheckCircle2, Calculator, BarChart3, Calendar, Link2 } from "lucide-react";

export const Solution = () => {
  const features = [
    {
      icon: Calculator,
      title: "Custos Diretos",
      description: "Aba completa para materiais, mão de obra e equipamentos com cálculos automáticos"
    },
    {
      icon: BarChart3,
      title: "Dashboard Automático",
      description: "Gráficos visuais para saber exatamente para onde o dinheiro está indo"
    },
    {
      icon: Calendar,
      title: "Cronograma Físico-Financeiro",
      description: "Saiba quanto você vai gastar por semana e mantenha tudo sob controle"
    },
    {
      icon: Link2,
      title: "Integração SINAPI (Bônus)",
      description: "Link direto para consultar a tabela oficial de preços da construção civil"
    }
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Transforme sua Obra em um Processo de Engenharia
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Uma ferramenta pronta para usar. Basta inserir a metragem e os valores unitários 
              (ensinamos onde pegar) e a planilha calcula o custo total, a curva ABC 
              (onde você gasta mais) e o cronograma financeiro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-card-foreground flex items-center gap-2">
                      {feature.title}
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
