import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const reviews = [
    {
        name: "Ricardo Silva",
        role: "Proprietário",
        content: "Eu estava perdido com as contas da minha obra. Essa planilha salvou meu orçamento. Consegui ver exatamente onde estava gastando muito.",
        rating: 5,
    },
    {
        name: "Ana Paula",
        role: "Arquiteta",
        content: "Simples e direta. Uso com meus clientes para mostrar a transparência dos custos. Muito melhor que softwares caros.",
        rating: 5,
    },
    {
        name: "Carlos Eduardo",
        role: "Reformando Casa",
        content: "O cronograma financeiro é a melhor parte. Parei de ter surpresas no fim do mês. Recomendo demais!",
        rating: 5,
    },
];

export function Reviews() {
    return (
        <section className="py-20 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">O que dizem quem já usa</h2>
                    <p className="text-xl text-muted-foreground">
                        Junte-se a mais de 120 proprietários que assumiram o controle.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {reviews.map((review, index) => (
                        <Card key={index} className="border-none shadow-md">
                            <CardContent className="pt-6">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-muted-foreground mb-6 italic">"{review.content}"</p>
                                <div>
                                    <p className="font-bold">{review.name}</p>
                                    <p className="text-sm text-muted-foreground">{review.role}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
