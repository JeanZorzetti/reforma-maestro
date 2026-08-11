import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CadastrarForm } from "@/components/app/cadastrar-form";

export default function CadastrarPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <p className="text-sm text-muted-foreground">14 dias grátis, sem cartão.</p>
      </CardHeader>
      <CardContent>
        <CadastrarForm />
        <div className="mt-4 text-sm text-muted-foreground">
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </div>
      </CardContent>
    </Card>
  );
}
