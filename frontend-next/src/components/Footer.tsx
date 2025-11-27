import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-foreground/5 py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center text-muted-foreground text-sm">
          <div className="mb-4">
            <Link href="/blog" className="text-primary hover:underline font-medium">
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
