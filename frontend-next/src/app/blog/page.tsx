import Link from "next/link";
import { blogPosts } from "@/data/blog-posts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function BlogPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-foreground">Blog do Reforma Maestro</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Dicas práticas, tutoriais e alertas para você reformar sem estourar o orçamento e sem dor de cabeça.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
                {blogPosts.map((post) => (
                    <Card key={post.slug} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-center mb-2">
                                <Badge variant="secondary">{post.category}</Badge>
                                <span className="text-sm text-muted-foreground">{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <CardTitle className="text-2xl leading-tight">
                                <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                                    {post.title}
                                </Link>
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                {post.excerpt}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto pt-0">
                            <Button asChild variant="ghost" className="p-0 h-auto hover:bg-transparent hover:text-primary group">
                                <Link href={`/blog/${post.slug}`} className="flex items-center gap-2">
                                    Ler artigo completo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
