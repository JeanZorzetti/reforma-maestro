"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/server/actions/auth";
import type { ActionResult } from "@/server/actions/types";

const initialState: ActionResult<{ userId: string }> | undefined = undefined;

export function CadastrarForm() {
  const [state, formAction, pending] = useActionState(async (
    _prev: ActionResult<{ userId: string }> | undefined,
    formData: FormData,
  ) => {
    return signUp(formData);
  }, initialState);

  const fields = state && !state.ok ? state.fields : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" type="text" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
        {fields?.email && <p className="text-sm text-destructive">{fields.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" minLength={8} required />
        {fields?.senha && <p className="text-sm text-destructive">{fields.senha}</p>}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
