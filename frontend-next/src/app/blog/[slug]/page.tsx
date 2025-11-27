import { blogPosts } from "@/data/blog-posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlogPostPageProps {
    params: {
        slug: string;
    };
}

// Generate static params for all blog posts
export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
    const post = blogPosts.find((p) => p.slug === params.slug);

    if (!post) {
        notFound();
    }

    return (
        <article className="container mx-auto px-4 py-12 max-w-3xl">
            <Button asChild variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
                <Link href="/blog" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar para o Blog
                </Link>
            </Button>

            <header className="mb-8">
                <div className="flex gap-2 mb-4">
                    <Badge>{post.category}</Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                    {post.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                </div>
            </header>

            <div
                className="prose prose-lg dark:prose-invert max-w-none mb-12"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.faqSchema && (
                <div dangerouslySetInnerHTML={{ __html: post.faqSchema }} />
            )}

            <div className="bg-muted/50 p-8 rounded-lg border border-border text-center mt-12">
                <h3 className="text-2xl font-bold mb-4">Gostou das dicas?</h3>
                <p className="text-muted-foreground mb-6">
                    Pare de sofrer com planilhas complicadas ou anotações no caderno.
                    O <strong>Gestor Financeiro de Obras 1.0</strong> é a ferramenta definitiva para quem quer reformar sem estresse.
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/#pricing">
                        Quero controlar minha obra agora
                    </Link>
                </Button>
            </div>
        </article>
    );
}
