import { Inbox, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { ClassOperations } from "@/components/shared/ClassOperations";
import { TeacherFilterBar } from "@/components/teacher/TeacherFilterBar";
import { TeacherQuestionCard } from "@/components/teacher/QuestionDetailDrawer";
import { STORAGE_BUCKET, type ErrorReason } from "@/lib/constants";

export const metadata = { title: "Öğretmen Paneli — Fizik Analiz Paneli" };

async function getTeacherQuestions(
  teacherId: string,
  filters: { reason?: string; classId?: string; studentId?: string }
) {
  const supabase = await createClient();

  const { data: classes } = await supabase.from("classes").select("id,name").eq("teacher_id", teacherId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) return { classes: [], students: [], questions: [] };

  let query = supabase.from("questions").select("*").in("class_id", classIds).order("created_at", { ascending: false });

  if (filters.reason) query = query.eq("error_reason", filters.reason as ErrorReason);
  if (filters.classId) query = query.eq("class_id", filters.classId);
  if (filters.studentId) query = query.eq("student_id", filters.studentId);

  const { data: rows } = await query;
  const questions = rows ?? [];

  const studentIds = Array.from(new Set(questions.map((q) => q.student_id)));
  const subOutcomeIds = Array.from(new Set(questions.map((q) => q.sub_outcome_id)));

  const [{ data: profiles }, { data: subOutcomes }, signedUrls] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id,full_name").in("id", studentIds)
      : Promise.resolve({ data: [] }),
    subOutcomeIds.length
      ? supabase.from("sub_outcomes").select("id,code").in("id", subOutcomeIds)
      : Promise.resolve({ data: [] }),
    Promise.all(questions.map((q) => supabase.storage.from(STORAGE_BUCKET).createSignedUrl(q.image_path, 600))),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const codeById = new Map((subOutcomes ?? []).map((s) => [s.id, s.code]));

  return {
    classes: classes ?? [],
    students: studentIds.map((id) => ({ id, name: nameById.get(id) ?? "Öğrenci" })),
    questions: questions.map((q, i) => ({
      ...q,
      studentName: nameById.get(q.student_id) ?? "Öğrenci",
      subOutcomeCode: codeById.get(q.sub_outcome_id) ?? "",
      imageUrl: signedUrls[i].data?.signedUrl ?? null,
    })),
  };
}

export default async function TeacherPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; classId?: string; studentId?: string }>;
}) {
  const [user, filters] = await Promise.all([getCurrentUser(), searchParams]);
  const { classes, students, questions } = user
    ? await getTeacherQuestions(user.id, filters)
    : { classes: [], students: [], questions: [] };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Öğretmen Paneli</h1>
        <p className="text-sm text-muted-foreground">
          Hoş geldin {user?.full_name}. Sınıflarındaki kayıtları buradan izleyeceksin.
        </p>
      </div>

      <ClassOperations role="teacher" />

      <TeacherFilterBar classes={classes} students={students} />

      {questions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutGrid className="size-5 text-primary" />
              Soru kartları
            </CardTitle>
            <CardDescription>Henüz kayıt yok.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Inbox className="size-4" />
              Sınıfına öğrenci katıldığında ve soru eklediğinde burada görünecek.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {questions.map((q) => (
            <TeacherQuestionCard
              key={q.id}
              question={{
                id: q.id,
                imageUrl: q.imageUrl,
                title: `${q.studentName} — ${q.subOutcomeCode}`,
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
  );
}
