import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLancamento } from "@/db/queries/lancamentos";
import { LancamentoForm } from "@/components/app/lancamento-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditarLancamentoPage({
  params,
}: {
  params: Promise<{ id: string; lancamentoId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id, lancamentoId } = await params;
  const lancamento = await getLancamento(session.user.id, lancamentoId);
  if (!lancamento || lancamento.obraId !== id) notFound();

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Editar lançamento</CardTitle>
      </CardHeader>
      <CardContent>
        <LancamentoForm
          obraId={id}
          lancamentoId={lancamento.id}
          defaultValues={{
            data: lancamento.data,
            categoria: lancamento.categoria,
            item: lancamento.item,
            fornecedor: lancamento.fornecedor ?? "",
            previsto: (lancamento.previstoCents / 100).toFixed(2).replace(".", ","),
            pago: (lancamento.pagoCents / 100).toFixed(2).replace(".", ","),
          }}
        />
      </CardContent>
    </Card>
  );
}
