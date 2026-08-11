import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntrarForm } from "@/components/app/entrar-form";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <CardContent>
        <EntrarForm next={next ?? "/app"} />
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
          <Link href="/cadastrar">Criar conta</Link>
        </div>
      </CardContent>
    </Card>
  );
}
