"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { arquivarObra } from "@/server/actions/obras";

export function ObraArchiveButton({ obraId }: { obraId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("obraId", obraId);
      const result = await arquivarObra(formData);
      if (!result.ok) return;
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onClick}>
      {pending ? "Arquivando..." : "Arquivar obra"}
    </Button>
  );
}
