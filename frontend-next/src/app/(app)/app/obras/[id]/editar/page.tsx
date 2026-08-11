import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import { getObra } from "@/db/queries/obras";
import { countLancamentos } from "@/server/actions/obras";
import { ObraForm } from "@/components/app/obra-form";
import { ObraDeleteDialog } from "@/components/app/obra-delete-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditarObraPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const access = await getAccess(session.user.id);
  if (access.tier !== "full") redirect("/app/assinar");

  const { id } = await params;
  const obra = await getObra(session.user.id, id);
  if (!obra) notFound();

  const totalLancamentos = await countLancamentos(session.user.id, id);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar obra</CardTitle>
        </CardHeader>
        <CardContent>
          <ObraForm
            obraId={obra.id}
            defaultValues={{
              nome: obra.nome,
              orcamentoTeto: (obra.orcamentoTetoCents / 100).toFixed(2).replace(".", ","),
              reservaPct: obra.reservaPct,
            }}
          />
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Excluir obra</CardTitle>
        </CardHeader>
        <CardContent>
          <ObraDeleteDialog obraId={obra.id} obraNome={obra.nome} totalLancamentos={totalLancamentos} />
        </CardContent>
      </Card>
    </div>
  );
}
