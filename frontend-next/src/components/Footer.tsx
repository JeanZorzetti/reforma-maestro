import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-foreground/5 py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center text-muted-foreground text-sm">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/sobre" className="hover:text-primary transition-colors">
              Sobre
            </Link>
            <Link href="/blog" className="hover:text-primary transition-colors">
              Visite nosso Blog
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Reforma Maestro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
