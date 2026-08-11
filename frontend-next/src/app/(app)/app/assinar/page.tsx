import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import { createCheckoutSession } from "@/server/actions/assinatura";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AssinarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const access = await getAccess(session.user.id);
  if (access.tier === "full" && access.status === "active") redirect("/app");

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Assine o Reforma Maestro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Controle financeiro completo das suas obras</li>
          <li>Cadastro ilimitado de obras e lançamentos</li>
          <li>Painel com totais, saldo e alerta de estouro de orçamento</li>
          <li>Exportação em CSV a qualquer momento</li>
        </ul>
        <form
          action={async () => {
            "use server";
            await createCheckoutSession();
          }}
        >
          <Button type="submit" className="w-full">
            Assinar agora
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
