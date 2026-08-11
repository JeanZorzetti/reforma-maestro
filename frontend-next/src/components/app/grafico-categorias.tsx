"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PainelPorCategoria } from "@/db/queries/painel";
import { formatCents } from "@/lib/money";

const LABELS: Record<PainelPorCategoria["categoria"], string> = {
  material: "Material",
  mao_de_obra: "Mão de Obra",
  taxas: "Taxas",
  mobilia: "Mobília",
};

export function GraficoCategorias({ dados }: { dados: PainelPorCategoria[] }) {
  const data = dados.map((item) => ({
    categoria: LABELS[item.categoria],
    Previsto: item.totalPrevistoCents / 100,
    Pago: item.totalPagoCents / 100,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem lançamentos ainda.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="categoria" />
        <YAxis tickFormatter={(value) => formatCents(value * 100)} width={90} />
        <Tooltip formatter={(value) => formatCents(Number(value ?? 0) * 100)} />
        <Bar dataKey="Previsto" fill="#94a3b8" />
        <Bar dataKey="Pago" fill="#0f172a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
