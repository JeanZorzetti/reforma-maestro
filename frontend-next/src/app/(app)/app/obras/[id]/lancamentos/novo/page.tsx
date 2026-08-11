import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getObra } from "@/db/queries/obras";
import { LancamentoForm } from "@/components/app/lancamento-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NovoLancamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const obra = await getObra(session.user.id, id);
  if (!obra) notFound();

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Novo lançamento</CardTitle>
      </CardHeader>
      <CardContent>
        <LancamentoForm obraId={id} />
      </CardContent>
    </Card>
  );
}
