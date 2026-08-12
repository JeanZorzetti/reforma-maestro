"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "@/server/actions/auth";

export function ContaDeleteDialog({ obras }: { obras: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [senha, setSenha] = useState("");
  const [confirmouExportacao, setConfirmouExportacao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function onDelete(event: React.MouseEvent) {
    event.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("senha", senha);
      const result = await deleteAccount(formData);
      if (!result.ok) {
        setErro(
          result.fields?.senha ??
            (result.error === "STRIPE_INDISPONIVEL"
              ? "Não foi possível cancelar sua assinatura agora. Tente de novo em instantes."
              : "Não foi possível excluir a conta."),
        );
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  const podeExcluir = senha.length > 0 && (obras.length === 0 || confirmouExportacao);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir minha conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso apaga suas obras, seus lançamentos e cancela sua assinatura. A
            ação é irreversível — depois de excluída, seus dados não podem ser
            recuperados nem exportados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {obras.length > 0 && (
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p>Exporte seus dados antes de continuar — depois não dá mais.</p>
            <div className="flex flex-wrap gap-2">
              {obras.map((obra) => (
                <a
                  key={obra.id}
                  href={`/api/obras/${obra.id}/export`}
                  className="underline"
                  onClick={() => setConfirmouExportacao(true)}
                >
                  {obra.nome} (CSV)
                </a>
              ))}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={confirmouExportacao}
                onChange={(e) => setConfirmouExportacao(e.target.checked)}
              />
              Já exportei o que preciso, pode excluir.
            </label>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="senha-exclusao">Digite sua senha para confirmar</Label>
          <Input
            id="senha-exclusao"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={pending || !podeExcluir} onClick={onDelete}>
            Excluir definitivamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
