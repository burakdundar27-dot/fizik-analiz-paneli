import { notFound } from "next/navigation";
import { FileQuestion, ListOrdered } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getStudentWeakTopics } from "@/lib/actions/analysis-actions";
import { TeacherQuestionCard } from "@/components/teacher/QuestionDetailDrawer";
import { STORAGE_BUCKET } from "@/lib/constants";

export const metadata = { title: "Öğrenci Detayı — Fizik Analiz Paneli" };

async function getStudentQuestions(studentId: string) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("questions")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  const questions = rows ?? [];

  const subOutcomeIds = Array.from(new Set(questions.map((q) => q.sub_outcome_id)));
  const [{ data: subOutcomes }, signedUrls] = await Promise.all([
    subOutcomeIds.length
      ? supabase.from("sub_outcomes").select("id,code").in("id", subOutcomeIds)
      : Promise.resolve({ data: [] }),
    Promise.all(questions.map((q) => supabase.storage.from(STORAGE_BUCKET).createSignedUrl(q.image_path, 600))),
  ]);
  const codeById = new Map((subOutcomes ?? []).map((s) => [s.id, s.code]));

  return questions.map((q, i) => ({
    ...q,
    subOutcomeCode: codeById.get(q.sub_outcome_id) ?? "",
    imageUrl: signedUrls[i].data?.signedUrl ?? null,
  }));
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [user, { data: student }] = await Promise.all([
    getCurrentUser(),
    supabase.from("profiles").select("id,full_name,grade_level").eq("id", id).maybeSingle(),
  ]);
  if (!user || !student) notFound();

  const [questions, weakTopics] = await Promise.all([
    getStudentQuestions(student.id),
    getStudentWeakTopics(student.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{student.full_name}</h1>
        <p className="text-sm text-muted-foreground">
          {student.grade_level ? `${student.grade_level}. sınıf · ` : ""}
          {questions.length} kayıt
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="size-5 text-primary" />
            En Çok Yanlış Yapılan Konular
          </CardTitle>
          <CardDescription>En sık tekrarlanan eksikler, en çoktan aza sıralı.</CardDescription>
        </CardHeader>
        <CardContent>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz veri yok.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {weakTopics.map((t, i) => (
                  <tr key={t.title} className="border-b last:border-0">
                    <td className="w-8 py-2 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2">{t.title}</td>
                    <td className="py-2 text-right font-medium">{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Soru geçmişi</h2>
        {questions.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileQuestion className="size-4" />
            Bu öğrencinin henüz kaydı yok.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {questions.map((q) => (
              <TeacherQuestionCard
                key={q.id}
                question={{
                  id: q.id,
                  imageUrl: q.imageUrl,
                  title: q.subOutcomeCode,
                  createdAt: q.created_at,
                  errorReason: q.error_reason,
                  status: q.status,
                  studentNote: q.student_note,
                  teacherNote: q.teacher_note,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
