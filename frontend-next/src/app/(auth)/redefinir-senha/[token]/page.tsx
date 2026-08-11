import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RedefinirSenhaForm } from "@/components/app/redefinir-senha-form";

export default async function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
      </CardHeader>
      <CardContent>
        <RedefinirSenhaForm token={token} />
      </CardContent>
    </Card>
  );
}
