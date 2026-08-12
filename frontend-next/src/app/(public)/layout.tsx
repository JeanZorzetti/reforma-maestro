import { Footer } from "@/components/Footer";

/**
 * O rodapé vive aqui, não em cada página: antes só a home renderizava `<Footer />`,
 * e /sobre, /privacidade e /blog terminavam sem rodapé nenhum.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
