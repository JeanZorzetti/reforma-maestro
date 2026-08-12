import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export const Footer = () => {
  return (
    <footer className="bg-foreground/5 py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center text-muted-foreground text-sm">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-base font-bold text-foreground">
            <LogoMark className="h-6 w-6" />
            <span>
              <span className="text-primary">Reforma</span> Maestro
            </span>
          </Link>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/sobre" className="hover:text-primary transition-colors">
              Sobre
            </Link>
            <Link href="/blog" className="hover:text-primary transition-colors">
              Visite nosso Blog
            </Link>
            <Link href="/privacidade" className="hover:text-primary transition-colors">
              Privacidade
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
