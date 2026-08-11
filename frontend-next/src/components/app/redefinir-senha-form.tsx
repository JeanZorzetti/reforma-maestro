"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/server/actions/auth";
import type { ActionResult } from "@/server/actions/types";

const initialState: ActionResult | undefined = undefined;

export function RedefinirSenhaForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult | undefined, formData: FormData) => {
    return resetPassword(formData);
  }, initialState);

  useEffect(() => {
    if (state?.ok) router.push("/entrar");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="senha">Nova senha</Label>
        <Input id="senha" name="senha" type="password" minLength={8} required />
        {state && !state.ok && (
          <p className="text-sm text-destructive">
            {state.error === "TOKEN_INVALIDO" ? "Link inválido ou expirado." : state.fields?.senha}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Redefinindo..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
