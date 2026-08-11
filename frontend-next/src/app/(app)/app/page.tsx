import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listObras } from "@/db/queries/obras";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SeletorObrasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?next=/app");

  const obras = await listObras(session.user.id);
  if (obras.length === 0) redirect("/app/obras/nova");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Suas obras</h1>
        <Button asChild className="self-start">
          <Link href="/app/obras/nova">Nova obra</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {obras.map((obra) => (
          <Link key={obra.id} href={`/app/obras/${obra.id}`}>
            <Card className="transition hover:border-primary">
              <CardHeader>
                <CardTitle className="text-base">{obra.nome}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Orçamento: {(obra.orcamentoTetoCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
