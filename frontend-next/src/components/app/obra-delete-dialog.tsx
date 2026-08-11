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
import { deleteObra } from "@/server/actions/obras";

export function ObraDeleteDialog({
  obraId,
  obraNome,
  totalLancamentos,
}: {
  obraId: string;
  obraNome: string;
  totalLancamentos: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function onDelete(event: React.MouseEvent) {
    event.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("obraId", obraId);
      formData.set("confirmacao", confirmacao);
      const result = await deleteObra(formData);
      if (!result.ok) {
        setErro(result.fields?.confirmacao ?? "Não foi possível excluir a obra.");
        return;
      }
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir obra</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir &quot;{obraNome}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            {totalLancamentos > 0
              ? `Isso apaga a obra e ${totalLancamentos} lançamento${totalLancamentos === 1 ? "" : "s"}. Essa ação não pode ser desfeita.`
              : "Essa ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirmacao">Digite &quot;{obraNome}&quot; para confirmar</Label>
          <Input
            id="confirmacao"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || confirmacao !== obraNome}
            onClick={onDelete}
          >
            Excluir definitivamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
