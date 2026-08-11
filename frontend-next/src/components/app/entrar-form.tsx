"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/server/actions/auth";
import type { ActionResult } from "@/server/actions/types";

const initialState: ActionResult | undefined = undefined;

export function EntrarForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult | undefined, formData: FormData) => {
    return login(formData);
  }, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" required />
      </div>
      {state && !state.ok && <p className="text-sm text-destructive">E-mail ou senha incorretos.</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
