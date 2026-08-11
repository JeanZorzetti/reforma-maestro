import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/server/actions/auth";

export default function RecuperarSenhaPage() {
  async function action(formData: FormData) {
    "use server";
    await requestPasswordReset(formData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <Button type="submit" className="w-full">
            Enviar link de redefinição
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Se o e-mail tiver conta, você recebe um link para redefinir a senha.
        </p>
      </CardContent>
    </Card>
  );
}
