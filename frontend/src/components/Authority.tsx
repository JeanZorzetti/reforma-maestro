import { Award, GraduationCap } from "lucide-react";

export const Authority = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-16 w-16 md:h-20 md:w-20 text-primary-foreground" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                  <Award className="h-6 w-6 text-accent" />
                  <span className="text-sm font-semibold text-accent uppercase tracking-wide">
                    Desenvolvida por Especialista
                  </span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-card-foreground">
                  Maria Eduarda Zorzetti
                </h3>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Engenheira Mecânica</span> e{" "}
                  <span className="font-semibold text-foreground">Pesquisadora de Mercado</span>. 
                  Criei esta ferramenta para eliminar o "achismo" das reformas e trazer a precisão 
                  da engenharia para pequenas e médias obras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
