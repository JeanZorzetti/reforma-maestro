"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { desarquivarObra } from "@/server/actions/obras";

export function ObraUnarchiveButton({ obraId }: { obraId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("obraId", obraId);
      await desarquivarObra(formData);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onClick}>
      {pending ? "Restaurando..." : "Desarquivar"}
    </Button>
  );
}
