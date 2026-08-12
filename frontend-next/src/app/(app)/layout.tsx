import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import { BannerAcesso } from "@/components/app/banner-acesso";
import { LogoMark } from "@/components/LogoMark";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const access = session?.user?.id ? await getAccess(session.user.id) : null;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/app" className="flex items-center gap-2 font-semibold">
            <LogoMark className="h-6 w-6" />
            Reforma Maestro
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/app/conta">Minha conta</Link>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>
      {access && (
        <div className="print:hidden">
          <BannerAcesso access={access} />
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
