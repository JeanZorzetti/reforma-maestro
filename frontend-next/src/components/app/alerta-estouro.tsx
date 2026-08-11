import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCents } from "@/lib/money";

export function AlertaEstouro({ excedidoCents }: { excedidoCents: number }) {
  if (excedidoCents <= 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Orçamento estourado</AlertTitle>
      <AlertDescription>
        O previsto está {formatCents(excedidoCents)} acima do orçamento teto.
      </AlertDescription>
    </Alert>
  );
}
