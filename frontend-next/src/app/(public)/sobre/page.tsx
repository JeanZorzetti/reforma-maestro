import { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    Download,
    PieChart,
    Receipt,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Sobre o Reforma Maestro | O que é, para quem é e o que não faz",
    description:
        "Controle financeiro de obras e reformas residenciais para quem está reformando o próprio imóvel. O que o app faz, o que ele não faz e quem mantém.",
    alternates: { canonical: "/sobre" },
};

const funcoes = [
    {
        icon: Building2,
        titulo: "Obras",
        texto: "Cadastre quantas obras quiser, cada uma com seu orçamento teto e uma porcentagem de fundo de reserva separada do resto.",
    },
    {
        icon: Receipt,
        titulo: "Lançamentos",
        texto: "Cada gasto entra com data, categoria (Material, Mão de Obra, Taxas, Mobília), valor previsto e valor pago. O status e a diferença saem calculados.",
    },
    {
        icon: PieChart,
        titulo: "Painel",
        texto: "Total previsto, total pago, saldo restante, quanto do orçamento já foi consumido, o fundo de reserva explícito e alerta quando a obra vai estourar.",
    },
    {
        icon: Download,
        titulo: "Exportação",
        texto: "CSV de qualquer obra, a qualquer momento — inclusive com a assinatura cancelada ou vencida. Seus dados saem quando você quiser.",
    },
];

const naoFaz = [
    "Não é um ERP de construção civil, nem concorre com Sienge ou Obra Prima.",
    "Não faz quantitativo, composição de custos nem orçamento de engenharia.",
    "Não integra com tabela SINAPI nem com sistemas de construtora.",
    "Não tem múltiplos usuários por conta, nem fluxo de aprovação.",
    "Não substitui engenheiro, arquiteto ou mestre de obras.",
];

const compromissos = [
    "Todo cálculo financeiro é feito no servidor. O que aparece na sua tela não é o navegador somando — é o valor conferido.",
    "A exportação em CSV funciona mesmo com a assinatura cancelada ou vencida. Seus dados nunca ficam reféns do pagamento.",
    "Se a assinatura expira ou o pagamento falha, a conta vira somente leitura e exportação. Nada é apagado.",
    "O teste são 14 dias com o produto inteiro, sem cartão de crédito.",
    "A exclusão da conta é imediata e irreversível quando você pedir.",
];

export default function AboutPage() {
    // Referencia a Organization emitida globalmente em <SchemaMarkup /> pelo @id,
    // em vez de declarar uma segunda entidade concorrente.
    const aboutSchema = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "Sobre o Reforma Maestro",
        "url": "https://orcaobra.roilabs.com.br/sobre",
        "mainEntity": { "@id": "https://orcaobra.roilabs.com.br/#organization" },
    };

    return (
        <div className="min-h-screen bg-background">
            <Script id="schema-about" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(aboutSchema)}
            </Script>

            {/* Hero */}
            <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                        Controle do dinheiro da sua obra —{" "}
                        <span className="text-primary">não do cronograma dela</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        O Reforma Maestro é um controle financeiro para quem está
                        reformando o próprio imóvel e precisa saber quanto já saiu do
                        bolso, quanto ainda tem e para onde o dinheiro está indo.
                    </p>
                </div>
            </section>

            {/* O recorte */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert mx-auto">
                        <h2>O problema não é a obra. É o caixa.</h2>
                        <p>
                            Gerenciar uma obra — prazo, execução, medição, qualidade do
                            serviço — é problema do engenheiro ou da construtora. O
                            problema de quem contrata é outro:{" "}
                            <strong>
                                fluxo de caixa pessoal durante um projeto de gasto
                                imprevisível e prolongado
                            </strong>
                            .
                        </p>
                        <p>
                            Reformas estouram o orçamento porque o controle de quem paga é
                            informal: anotação solta, conversa de WhatsApp com o
                            fornecedor, memória. Sem comparar{" "}
                            <strong>previsto contra realizado por categoria</strong>, o
                            estouro só aparece quando já aconteceu — e aí não há mais o que
                            ajustar.
                        </p>
                        <p>
                            É para isso que o app existe, e só para isso. Ele é feito para
                            pessoa física, dona do imóvel, sem formação em construção civil
                            e sem paciência para montar planilha — usando o celular no meio
                            da obra, não um desktop no escritório.
                        </p>
                    </div>
                </div>
            </section>

            {/* O que faz */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl font-bold mb-10 text-center">O que o app faz</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {funcoes.map((funcao) => (
                            <Card key={funcao.titulo} className="border shadow-sm">
                                <CardContent className="pt-6">
                                    <funcao.icon className="w-8 h-8 text-primary mb-4" />
                                    <h3 className="text-xl font-bold mb-2">{funcao.titulo}</h3>
                                    <p className="text-muted-foreground">{funcao.texto}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* O que não é */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl font-bold mb-4">
                        O que o Reforma Maestro não é
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Vale mais dizer isso agora do que você descobrir depois de assinar.
                    </p>
                    <ul className="space-y-4">
                        {naoFaz.map((item) => (
                            <li key={item} className="flex gap-3 items-start">
                                <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Origem */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert mx-auto">
                        <h2>De planilha a aplicativo</h2>
                        <p>
                            O Reforma Maestro começou como uma planilha do Google Sheets,
                            vendida avulsa e entregue manualmente a cada comprador. A lógica
                            funcionava — o formato é que não.
                        </p>
                        <p>
                            Planilha não guarda o histórico de uma obra para a seguinte, não
                            tem conta nem login, quebra quando alguém mexe na célula errada e
                            depende de alguém do outro lado provisionando o arquivo. Nada
                            disso tem conserto dentro de uma planilha.
                        </p>
                        <p>
                            Hoje é um web app com banco de dados, conta própria, várias obras
                            por usuário e assinatura mensal. O foco continua sendo o mesmo da
                            planilha original, porque era a parte que já dava certo:{" "}
                            <strong>o dinheiro</strong>. Não quantos sacos de cimento foram
                            usados — quanto saiu da sua conta e quanto ainda resta.
                        </p>
                    </div>
                </div>
            </section>

            {/* Compromissos */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl font-bold mb-8">Nossos compromissos</h2>
                    <ul className="space-y-4">
                        {compromissos.map((item) => (
                            <li key={item} className="flex gap-3 items-start">
                                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{item}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-muted-foreground mt-6 text-sm">
                        O detalhe de retenção e exclusão de dados está na{" "}
                        <Link href="/privacidade" className="text-primary hover:underline">
                            página de privacidade
                        </Link>
                        .
                    </p>
                </div>
            </section>

            {/* Quem mantém */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold mb-4">Quem mantém</h2>
                    <p className="text-muted-foreground">
                        O Reforma Maestro é desenvolvido e mantido pela{" "}
                        <strong>ROI Labs</strong>. Dúvida, problema na conta ou pedido de
                        exclusão de dados:{" "}
                        <a
                            href="mailto:suporte@roilabs.com.br"
                            className="text-primary hover:underline"
                        >
                            suporte@roilabs.com.br
                        </a>
                        .
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-6">
                        Veja se serve para a sua obra
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        14 dias com o produto inteiro, sem cartão de crédito. Se não for
                        para você, é só não assinar.
                    </p>
                    <Button asChild size="xl" variant="cta">
                        <Link href="/#pricing" className="flex items-center gap-2">
                            Testar grátis <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
