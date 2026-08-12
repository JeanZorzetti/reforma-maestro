"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
import { deleteLancamento, excluirSerieParcelamento } from "@/server/actions/lancamentos";

export function LancamentoRowActions({
  obraId,
  lancamentoId,
  parcelamentoId,
  serieCount,
}: {
  obraId: string;
  lancamentoId: string;
  parcelamentoId?: string | null;
  serieCount?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingSerie, startTransitionSerie] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("lancamentoId", lancamentoId);
      await deleteLancamento(formData);
      router.refresh();
    });
  }

  function onDeleteSerie() {
    if (!parcelamentoId) return;
    startTransitionSerie(async () => {
      const formData = new FormData();
      formData.set("parcelamentoId", parcelamentoId);
      await excluirSerieParcelamento(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/app/obras/${obraId}/lancamentos/${lancamentoId}/editar`}>Editar</Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive">
            Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={onDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {parcelamentoId && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              Excluir série
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir a série inteira?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso vai remover {serieCount ?? "todos os"} lançamento{serieCount === 1 ? "" : "s"} desse
                parcelamento. Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={pendingSerie} onClick={onDeleteSerie}>
                Excluir série
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
