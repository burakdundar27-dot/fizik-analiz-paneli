"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MonthlyReportData } from "@/lib/monthly-report-pdf";

export function MonthlyReportButton({ data }: { data: MonthlyReportData }) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleClick() {
    setIsGenerating(true);
    try {
      const { generateMonthlyReportPdf } = await import("@/lib/monthly-report-pdf");
      await generateMonthlyReportPdf(data);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={isGenerating} onClick={handleClick}>
      {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
      Aylık Gelişim Raporu Al (PDF)
    </Button>
  );
}
