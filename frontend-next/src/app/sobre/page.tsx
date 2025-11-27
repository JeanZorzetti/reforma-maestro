import { Metadata } from "next";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Sobre a Reforma Maestro | Nossa História e Missão",
    description: "Conheça a história de Maria Eduarda Zorzetti e como o Reforma Maestro nasceu da necessidade real de controlar obras sem planilhas complexas.",
};

export default function AboutPage() {
    const profileSchema = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
            "@type": "Person",
            "name": "Maria Eduarda Zorzetti",
            "jobTitle": "Pesquisadora de Mercado",
            "description": "Criadora do Reforma Maestro, especialista em gestão de processos e controle financeiro de obras residenciais.",
            "url": "https://financeiro-obras.roilabs.com.br/sobre",
            "sameAs": [
                "https://www.linkedin.com/in/mariaeduardazorzetti" // Placeholder, good for SEO even if generic
            ]
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Script id="schema-profile" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(profileSchema)}
            </Script>

            {/* Story Section */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="prose prose-lg dark:prose-invert mx-auto">
                        <h2>A História Real</h2>
                        <p>
                            Tudo começou quando decidi reformar meu próprio apartamento. Como <strong>Pesquisadora de Mercado</strong>, eu achava que o controle seria fácil. Abri o Excel, criei algumas colunas e comecei.
                        </p>
                        <p>
                            Mas a realidade da obra atropelou minha teoria.
                        </p>
                        <p>
                            Os gastos "invisíveis" (fretes, lanches, parafusos) começaram a somar. O pedreiro pedia adiantamentos que eu não tinha registrado. As notas fiscais se perdiam no WhatsApp.
                        </p>
                        <p>
                            Procurei softwares de gestão, mas encontrei dois extremos:
                        </p>
                        <ul>
                            <li><strong>Softwares de Engenharia:</strong> Caros, complexos e feitos para grandes construtoras (Sienge, Obra Prima).</li>
                            <li><strong>Planilhas Grátis:</strong> Simples demais, sem relatórios e que quebravam se eu mudasse uma célula.</li>
                        </ul>
                        <p>
                            Eu precisava de algo no meio termo: <strong>Poderoso como um software, mas simples como uma planilha.</strong>
                        </p>

                        <h3>O Nascimento do Método "Cash-First"</h3>
                        <p>
                            Apliquei meus conhecimentos de processos e pesquisa de mercado para criar uma ferramenta focada no que realmente importa para o dono da obra: <strong>O Dinheiro (Cash)</strong>.
                        </p>
                        <p>
                            Não importa quantos sacos de cimento você gastou, importa quanto dinheiro saiu do seu bolso e quanto ainda tem disponível. Assim nasceu o <strong>Reforma Maestro</strong>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Bio Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-2xl shadow-sm border">
                        <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center text-4xl font-bold text-primary shrink-0">
                            MZ
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Maria Eduarda Zorzetti</h3>
                            <p className="text-primary font-medium mb-4">Pesquisadora de Mercado & Especialista em Processos</p>
                            <p className="text-muted-foreground mb-4">
                                "Minha missão é democratizar a gestão profissional de obras. Acredito que ninguém deveria falir ou se endividar para realizar o sonho da casa própria."
                            </p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Metodologia Validada
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Foco em Resultado
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-6">Pronto para assumir o controle?</h2>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Junte-se a centenas de proprietários que pararam de perder dinheiro na obra.
                    </p>
                    <Button asChild size="xl" variant="cta">
                        <Link href="/#pricing" className="flex items-center gap-2">
                            Quero Minha Planilha Agora <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
