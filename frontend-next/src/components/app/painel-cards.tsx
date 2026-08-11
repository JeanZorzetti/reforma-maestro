import { pctConsumido, reservaCents, saldoDisponivelCents } from "@/lib/calc";
import { formatCents } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PainelCardsProps {
  orcamentoTetoCents: number;
  reservaPct: number;
  totalPrevistoCents: number;
  totalPagoCents: number;
}

export function PainelCards(props: PainelCardsProps) {
  const reserva = reservaCents(props);
  const saldoDisponivel = saldoDisponivelCents(props);
  const pct = pctConsumido(props);

  const cards = [
    { label: "Total previsto", value: formatCents(props.totalPrevistoCents) },
    { label: "Total pago", value: formatCents(props.totalPagoCents) },
    { label: "Saldo disponível", value: formatCents(saldoDisponivel) },
    { label: "% consumido", value: `${pct.toFixed(1)}%` },
    { label: `Fundo de reserva (${props.reservaPct}%)`, value: formatCents(reserva) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{card.value}</CardContent>
        </Card>
      ))}
    </div>
  );
}
