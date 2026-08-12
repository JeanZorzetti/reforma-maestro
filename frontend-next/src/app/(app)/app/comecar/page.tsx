import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ObraForm } from "@/components/app/obra-form";
import { ObraExemploButton } from "@/components/app/obra-exemplo-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ComecarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?next=/app/comecar");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold">Bem-vindo ao Reforma Maestro</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre sua obra, defina um orçamento teto e lance cada gasto conforme ele
          acontece. O painel mostra na hora quanto já saiu do bolso e quanto falta —
          sem planilha.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastre sua primeira obra</CardTitle>
        </CardHeader>
        <CardContent>
          <ObraForm />
        </CardContent>
      </Card>

      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">Ainda não tem uma obra em mãos?</p>
        <ObraExemploButton />
        <p className="text-xs text-muted-foreground">
          Cria uma obra marcada como exemplo, com lançamentos ilustrativos. Pode ser
          excluída a qualquer momento.
        </p>
      </div>
    </div>
  );
}
