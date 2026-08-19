"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type OutcomeAnalysisChartProps = { data: { code: string; count: number }[] };

export function OutcomeAnalysisChart({ data }: OutcomeAnalysisChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz veri yok.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} fontSize={12} />
        <YAxis type="category" dataKey="code" width={90} fontSize={12} />
        <Tooltip />
        <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
