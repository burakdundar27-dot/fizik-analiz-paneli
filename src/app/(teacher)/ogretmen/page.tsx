import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { AddStudentForm } from "@/components/teacher/AddStudentForm";

export const metadata = { title: "Öğretmen Paneli — Fizik Analiz Paneli" };

async function getLinkedStudents(teacherId: string) {
  const supabase = await createClient();
  const { data: links } = await supabase.from("student_teacher").select("student_id").eq("teacher_id", teacherId);
  const studentIds = (links ?? []).map((l) => l.student_id);
  if (studentIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name,grade_level")
    .in("id", studentIds);

  return (profiles ?? []).sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
}

export default async function TeacherPanelPage() {
  const user = await getCurrentUser();
  const students = user ? await getLinkedStudents(user.id) : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Öğretmen Paneli</h1>
        <p className="text-sm text-muted-foreground">
          Hoş geldin {user?.full_name}. Öğrencilerini buradan izleyeceksin.
        </p>
      </div>

      <AddStudentForm />

      {students.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5 text-primary" />
              Öğrencilerim
            </CardTitle>
            <CardDescription>Henüz eklenmiş öğrenci yok.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Yukarıdan öğrencinin kayıtlı e-postasını girip ekle, listede görünecek.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/ogretmen/ogrenci/${s.id}`}>
              <Card className="h-full transition-colors hover:bg-muted">
                <CardHeader>
                  <CardTitle className="text-base">{s.full_name}</CardTitle>
                  <CardDescription>{s.grade_level ? `${s.grade_level}. sınıf` : "Sınıf bilgisi yok"}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
