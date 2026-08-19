"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ERROR_REASONS, ERROR_REASON_HEX, type ErrorReason } from "@/lib/constants";

export type ErrorReasonChartProps = { counts: Partial<Record<ErrorReason, number>> };

export function ErrorReasonChart({ counts }: ErrorReasonChartProps) {
  const data = (Object.keys(counts) as ErrorReason[])
    .filter((reason) => (counts[reason] ?? 0) > 0)
    .map((reason) => ({ reason, name: ERROR_REASONS[reason].label, value: counts[reason]! }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz veri yok.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.reason} fill={ERROR_REASON_HEX[d.reason]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
