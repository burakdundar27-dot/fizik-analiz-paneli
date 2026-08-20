import { FileQuestion } from "lucide-react";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { QuestionCard } from "@/components/question/QuestionCard";
import { findPathToSubOutcome } from "@/components/questions/outcome-select.types";
import type { CurriculumData } from "@/components/questions/outcome-select.types";
import { STORAGE_BUCKET } from "@/lib/constants";

export const metadata = { title: "Soru Geçmişi — Fizik Analiz Paneli" };

async function getCurriculumData(supabase: Awaited<ReturnType<typeof createClient>>): Promise<CurriculumData> {
  const [units, topics, outcomes, subOutcomes] = await Promise.all([
    supabase.from("units").select("*"),
    supabase.from("topics").select("*"),
    supabase.from("outcomes").select("*"),
    supabase.from("sub_outcomes").select("*"),
  ]);

  return {
    units: units.data ?? [],
    topics: topics.data ?? [],
    outcomes: outcomes.data ?? [],
    subOutcomes: subOutcomes.data ?? [],
  };
}

export default async function GecmisPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const [{ data: questions, error }, curriculumData] = await Promise.all([
    supabase
      .from("questions")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
    getCurriculumData(supabase),
  ]);

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Sorular yüklenirken bir hata oluştu, sayfayı yenile.
      </p>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <FileQuestion className="size-8" />
        <p className="text-sm">Henüz kayıtlı sorun yok.</p>
      </div>
    );
  }

  const signedUrls = await Promise.all(
    questions.map((q) =>
      supabase.storage.from(STORAGE_BUCKET).createSignedUrl(q.image_path, 3600, {
        transform: { width: 800, quality: 80 },
      })
    )
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {questions.map((question, i) => {
        const path = findPathToSubOutcome(curriculumData, question.sub_outcome_id);
        const title = path ? `${path.outcome.title} › ${path.subOutcome.title}` : "Kazanım bulunamadı";

        return (
          <QuestionCard
            key={question.id}
            imageUrl={signedUrls[i].data?.signedUrl ?? null}
            title={title}
            createdAt={question.created_at}
            errorReason={question.error_reason}
            status={question.status}
            reviewStatus={question.review_status}
          />
        );
      })}
    </div>
  );
}
