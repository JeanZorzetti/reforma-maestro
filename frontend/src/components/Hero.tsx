import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-construction.jpg";

export const Hero = () => {
  const handleCTA = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/80" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
            Planilha de Orçamento de Obras e Reformas em Excel{" "}
            <span className="text-accent">(Atualizada 2025)</span>
          </h1>
          
          <p className="mb-8 text-xl md:text-2xl text-primary-foreground/90 font-medium">
            Não deixe sua obra custar o dobro do planejado. Tenha controle total de materiais, 
            mão de obra e cronograma em uma ferramenta profissional e automática.
          </p>
          
          <Button 
            variant="cta" 
            size="xl" 
            onClick={handleCTA}
            className="group"
          >
            BAIXAR PLANILHA AGORA - R$ 47,90
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Decorative Element */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
