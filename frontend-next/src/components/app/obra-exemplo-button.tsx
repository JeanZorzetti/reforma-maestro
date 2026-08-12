"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { criarObraExemplo } from "@/server/actions/obras";

export function ObraExemploButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await criarObraExemplo();
      if (!result.ok) return;
      router.push(`/app/obras/${result.data.obraId}`);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" className="w-full" disabled={pending} onClick={onClick}>
      {pending ? "Criando..." : "Prefiro só olhar — criar obra de exemplo"}
    </Button>
  );
}
