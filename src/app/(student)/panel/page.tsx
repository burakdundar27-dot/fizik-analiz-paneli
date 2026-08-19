import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { NewQuestionForm } from "./new-question-form";
import { ClassOperations } from "@/components/shared/ClassOperations";
import type { CurriculumData } from "@/components/questions/outcome-select.types";

export const metadata = { title: "Panelim — Fizik Analiz Paneli" };

async function getCurriculumData(): Promise<CurriculumData> {
  const supabase = await createClient();
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

async function getStudentClassId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", userId)
    .maybeSingle();

  return data?.class_id ?? null;
}

export default async function StudentPanelPage() {
  const [user, curriculumData] = await Promise.all([getCurrentUser(), getCurriculumData()]);
  const classId = user ? await getStudentClassId(user.id) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Merhaba {user?.full_name}</h1>
        <p className="text-sm text-muted-foreground">
          Yanlış yaptığın soruyu fotoğraflayıp kazanım ve hata nedeniyle etiketle.
        </p>
      </div>

      {!classId && <ClassOperations role="student" />}

      <NewQuestionForm data={curriculumData} gradeLevel={user?.grade_level ?? null} classId={classId} />
    </div>
  );
}
