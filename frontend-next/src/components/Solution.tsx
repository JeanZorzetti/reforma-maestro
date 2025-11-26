import { CheckCircle2, Calculator, BarChart3, AlertTriangle, FileText } from "lucide-react";

export const Solution = () => {
  const features = [
    {
      icon: Calculator,
      title: "Banco de Lançamentos",
      description: "Interface limpa para registrar gastos por categoria (Material, Mão de Obra, Acabamento)"
    },
    {
      icon: BarChart3,
      title: "Dashboard Executivo",
      description: "Gráficos automáticos que mostram a \"Barra de Vida\" do seu orçamento (Previsto vs. Realizado)"
    },
    {
      icon: AlertTriangle,
      title: "Alerta de Desvio",
      description: "O sistema avisa visualmente quando uma categoria está consumindo mais do que deveria"
    },
    {
      icon: FileText,
      title: "Relatório de Pagamentos",
      description: "Saiba exatamente o que já foi pago e o que está pendente para os próximos 30 dias"
    }
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Um Mini-Software de Gestão dentro do seu Excel
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Esqueça as anotações em caderno. Desenvolvemos uma estrutura de banco de dados simplificada
              onde você lança os gastos e o sistema gera os relatórios de inteligência financeira automaticamente.
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
