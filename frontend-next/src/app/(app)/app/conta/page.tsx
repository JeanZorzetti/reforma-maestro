import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { getAccess, precisaAssinar } from "@/lib/access";
import { createPortalSession } from "@/server/actions/assinatura";
import { listObras } from "@/db/queries/obras";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutSuccessTracker } from "@/components/app/checkout-success-tracker";
import { ContaDeleteDialog } from "@/components/app/conta-delete-dialog";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste grátis",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada — acesso completo até o fim do período pago",
  expired: "Expirada",
};

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { checkout } = await searchParams;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  const access = await getAccess(session.user.id);
  const obras = await listObras(session.user.id);

  return (
    <Card className="mx-auto max-w-md">
      {checkout === "sucesso" && <CheckoutSuccessTracker />}
      <CardHeader>
        <CardTitle>Minha conta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {session.user.email}
          </p>
          {sub && (
            <>
              <p>
                <span className="text-muted-foreground">Assinatura: </span>
                {STATUS_LABEL[sub.status] ?? sub.status}
              </p>
              <p>
                <span className="text-muted-foreground">Acesso até: </span>
                {sub.accessUntil.toLocaleDateString("pt-BR")}
              </p>
            </>
          )}
        </div>

        {sub?.stripeCustomerId ? (
          <form
            action={async () => {
              "use server";
              await createPortalSession();
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Gerenciar assinatura
            </Button>
          </form>
        ) : precisaAssinar(access) ? (
          <Button asChild className="w-full">
            <Link href="/app/assinar">Assinar agora</Link>
          </Button>
        ) : null}

        {obras.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm text-muted-foreground">Exportar dados</p>
            {obras.map((obra) => (
              <Button key={obra.id} asChild variant="outline" size="sm" className="w-full justify-start">
                <a href={`/api/obras/${obra.id}/export`}>{obra.nome} (CSV)</a>
              </Button>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <ContaDeleteDialog obras={obras.map((obra) => ({ id: obra.id, nome: obra.nome }))} />
        </div>
      </CardContent>
    </Card>
  );
}
