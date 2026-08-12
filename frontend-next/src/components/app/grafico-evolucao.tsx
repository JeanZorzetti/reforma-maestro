"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EvolucaoMes } from "@/db/queries/painel";
import { formatCents } from "@/lib/money";

export function GraficoEvolucao({
  dados,
  orcamentoTetoCents,
}: {
  dados: EvolucaoMes[];
  orcamentoTetoCents: number;
}) {
  if (dados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Evolução aparece a partir de 2 meses com lançamentos.
      </p>
    );
  }

  const data = dados.map((item) => ({
    mes: item.mes,
    Pago: item.pagoAcumulado / 100,
    Previsto: item.previstoAcumulado / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis tickFormatter={(value) => formatCents(value * 100)} width={90} />
        <Tooltip formatter={(value) => formatCents(Number(value ?? 0) * 100)} />
        <Legend />
        <ReferenceLine
          y={orcamentoTetoCents / 100}
          stroke="#dc2626"
          strokeDasharray="4 4"
          label={{ value: "Teto", position: "insideTopRight", fill: "#dc2626", fontSize: 12 }}
        />
        <Line type="monotone" dataKey="Previsto" stroke="#94a3b8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Pago" stroke="#0f172a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
