import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import { listObras } from "@/db/queries/obras";
import { BannerAcesso } from "@/components/app/banner-acesso";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const access = session?.user?.id ? await getAccess(session.user.id) : null;
  const obras = session?.user?.id ? await listObras(session.user.id) : [];

  return (
    <SidebarProvider>
      <AppSidebar obras={obras.map((o) => ({ id: o.id, nome: o.nome }))} />
      <SidebarInset className="bg-muted/20">
        <header className="flex items-center gap-2 border-b bg-background px-4 py-2 print:hidden">
          <SidebarTrigger />
        </header>
        {access && (
          <div className="print:hidden">
            <BannerAcesso access={access} />
          </div>
        )}
        <main className="mx-auto w-full max-w-5xl px-4 py-6 print:max-w-none print:p-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
