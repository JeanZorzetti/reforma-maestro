"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOutAction } from "@/server/actions/auth";

export interface AppSidebarObra {
  id: string;
  nome: string;
}

export function AppSidebar({ obras }: { obras: AppSidebarObra[] }) {
  const pathname = usePathname();
  const obraId = pathname.match(/^\/app\/obras\/([^/]+)/)?.[1];
  const obra = obraId ? obras.find((o) => o.id === obraId) : undefined;

  return (
    <Sidebar className="print:hidden">
      <SidebarHeader>
        <Link href="/app" className="flex items-center gap-2 px-2 py-1 font-semibold">
          <LogoMark className="h-6 w-6" />
          Reforma Maestro
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Obras</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/app"}>
                  <Link href="/app">Obras</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/app/obras/nova"}>
                  <Link href="/app/obras/nova">Nova obra</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/app/obras/arquivadas"}>
                  <Link href="/app/obras/arquivadas">Arquivadas</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {obra && obraId && (
          <SidebarGroup>
            <SidebarGroupLabel>{obra.nome}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === `/app/obras/${obraId}`}>
                    <Link href={`/app/obras/${obraId}`}>Dashboard</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(`/app/obras/${obraId}/lancamentos`)}>
                    <Link href={`/app/obras/${obraId}/lancamentos`}>Lançamentos</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === `/app/obras/${obraId}/relatorio`}>
                    <Link href={`/app/obras/${obraId}/relatorio`}>Relatório</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === `/app/obras/${obraId}/editar`}>
                    <Link href={`/app/obras/${obraId}/editar`}>Editar</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={`/api/obras/${obraId}/export`}>Exportar CSV</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/app/conta"}>
              <Link href="/app/conta">Minha conta</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            Sair
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
