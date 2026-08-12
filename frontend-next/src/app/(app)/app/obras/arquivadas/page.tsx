import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listObrasArquivadas } from "@/db/queries/obras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObraUnarchiveButton } from "@/components/app/obra-unarchive-button";

export default async function ObrasArquivadasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?next=/app/obras/arquivadas");

  const obras = await listObrasArquivadas(session.user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Obras arquivadas</h1>
        <Link href="/app" className="text-sm text-muted-foreground underline">
          Voltar
        </Link>
      </div>

      {obras.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma obra arquivada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {obras.map((obra) => (
            <Card key={obra.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link href={`/app/obras/${obra.id}`} className="hover:underline">
                    {obra.nome}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ObraUnarchiveButton obraId={obra.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
