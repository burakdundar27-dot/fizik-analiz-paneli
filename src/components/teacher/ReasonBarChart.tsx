"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Row = { reason: string; label: string; count: number; className: string };

const REASON_HEX: Record<string, string> = {
  misconception: "#dc2626",
  knowledge_gap: "#ea580c",
  calculation_error: "#d97706",
  diagram_error: "#7c3aed",
  unit_error: "#0d9488",
  misread_question: "#0284c7",
  careless: "#2563eb",
  time_pressure: "#71717a",
};

export function ReasonBarChart({ data }: { data: Row[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis allowDecimals={false} width={30} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.reason} fill={REASON_HEX[row.reason] ?? "#71717a"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CsvExportButton({ data }: { data: Row[] }) {
  function handleExport() {
    const csv = ["Hata Nedeni,Adet", ...data.map((row) => `${row.label},${row.count}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hata-nedeni-dagilimi.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport} className="gap-2">
      <Download className="size-4" />
      CSV indir
    </Button>
  );
}
