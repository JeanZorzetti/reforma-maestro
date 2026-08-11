import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import { ObraForm } from "@/components/app/obra-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NovaObraPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const access = await getAccess(session.user.id);
  if (access.tier !== "full") redirect("/app/assinar");

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Cadastrar obra</CardTitle>
      </CardHeader>
      <CardContent>
        <ObraForm />
      </CardContent>
    </Card>
  );
}
