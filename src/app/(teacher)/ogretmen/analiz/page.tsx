import { BarChart3, FileWarning, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/actions/analysis-actions";
import { CsvExportButton } from "@/components/teacher/ReasonBarChart";
import { ErrorReasonChart } from "@/components/analysis/ErrorReasonChart";
import { OutcomeAnalysisChart } from "@/components/analysis/OutcomeAnalysisChart";
import type { ErrorReason } from "@/lib/constants";

export const metadata = { title: "Analiz — Fizik Analiz Paneli" };

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function AnalysisPage() {
  const user = await getCurrentUser();
  const stats = user
    ? await getDashboardStats(user.id)
    : { total: 0, topReason: null, weakestUnit: null, reasonDistribution: [], topSubOutcomes: [] };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analiz</h1>
        <p className="text-sm text-muted-foreground">Öğrencilerinin genel eksik haritası.</p>
      </div>

      {stats.total === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="size-5 text-primary" />
              Analiz
            </CardTitle>
            <CardDescription>Henüz analiz edilecek veri yok.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Öğrencilerin soru kaydı eklediğinde burada özet ve grafik görünecek.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatTile icon={<FileWarning className="size-4" />} label="Toplam kayıt" value={String(stats.total)} />
            <StatTile
              icon={<Target className="size-4" />}
              label="En sık hata nedeni"
              value={stats.topReason ? `${stats.topReason.label} (${stats.topReason.count})` : "—"}
            />
            <StatTile
              icon={<BarChart3 className="size-4" />}
              label="En zayıf ünite"
              value={stats.weakestUnit ? `${stats.weakestUnit.title} (${stats.weakestUnit.count})` : "—"}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Hata nedeni dağılımı</CardTitle>
                <CardDescription>Öğrencilerinin tüm kayıtları.</CardDescription>
              </div>
              <CsvExportButton data={stats.reasonDistribution} />
            </CardHeader>
            <CardContent>
              <ErrorReasonChart
                counts={Object.fromEntries(
                  stats.reasonDistribution.map((r) => [r.reason, r.count])
                ) as Partial<Record<ErrorReason, number>>}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">En çok hata yapılan alt kazanımlar</CardTitle>
              <CardDescription>Öğrencilerinde en sık tekrarlanan eksikler.</CardDescription>
            </CardHeader>
            <CardContent>
              <OutcomeAnalysisChart data={stats.topSubOutcomes} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
