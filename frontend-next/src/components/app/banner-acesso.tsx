import Link from "next/link";
import type { Access } from "@/lib/access";
import { Button } from "@/components/ui/button";

export function BannerAcesso({ access }: { access: Access }) {
  if (access.tier === "full" && access.status !== "trialing") return null;

  if (access.status === "trialing") {
    const diasRestantes = Math.max(
      0,
      Math.ceil((access.accessUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    return (
      <div className="border-b bg-amber-50 px-4 py-2">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            {diasRestantes > 0
              ? `Faltam ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} do seu teste grátis.`
              : "Seu teste grátis termina hoje."}
          </span>
          <Button asChild size="sm">
            <Link href="/app/assinar">Assinar agora</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-destructive/10 px-4 py-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          Seu acesso está limitado à leitura e exportação — assine para voltar a criar e editar.
        </span>
        <Button asChild size="sm" variant="destructive">
          <Link href="/app/assinar">Assinar</Link>
        </Button>
      </div>
    </div>
  );
}
