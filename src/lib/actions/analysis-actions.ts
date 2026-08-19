import { createClient } from "@/lib/supabase/server";
import { ERROR_REASONS, asList, type ErrorReason } from "@/lib/constants";

type StatsQuestion = { error_reason: ErrorReason; sub_outcome_id: string };

type Stats = {
  total: number;
  topReason: { label: string; count: number } | null;
  weakestUnit: { title: string; count: number } | null;
  reasonDistribution: { reason: ErrorReason; label: string; count: number; className: string }[];
  topSubOutcomes: { code: string; count: number }[];
};

function emptyStats(): Stats {
  return {
    total: 0,
    topReason: null,
    weakestUnit: null,
    reasonDistribution: asList(ERROR_REASONS).map((item) => ({
      reason: item.value,
      label: item.label,
      count: 0,
      className: item.className,
    })),
    topSubOutcomes: [],
  };
}

/** Ortak aggregasyon: hem öğretmen (sınıf bazlı) hem öğrenci (kişisel) istatistikleri bunu kullanır. */
async function computeStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questions: StatsQuestion[]
): Promise<Stats> {
  if (questions.length === 0) return emptyStats();

  const reasonCounts = new Map<ErrorReason, number>();
  for (const q of questions) {
    reasonCounts.set(q.error_reason, (reasonCounts.get(q.error_reason) ?? 0) + 1);
  }

  const reasonDistribution = asList(ERROR_REASONS).map((item) => ({
    reason: item.value,
    label: item.label,
    count: reasonCounts.get(item.value) ?? 0,
    className: item.className,
  }));

  const topReasonEntry = reasonDistribution.reduce((best, cur) => (cur.count > best.count ? cur : best));
  const topReason = topReasonEntry.count > 0 ? { label: topReasonEntry.label, count: topReasonEntry.count } : null;

  const subOutcomeIds = Array.from(new Set(questions.map((q) => q.sub_outcome_id)));
  const { data: subOutcomes } = await supabase.from("sub_outcomes").select("id,code,outcome_id").in("id", subOutcomeIds);

  const subOutcomeCounts = new Map<string, number>();
  for (const q of questions) {
    subOutcomeCounts.set(q.sub_outcome_id, (subOutcomeCounts.get(q.sub_outcome_id) ?? 0) + 1);
  }
  const codeBySubOutcomeId = new Map((subOutcomes ?? []).map((s) => [s.id, s.code]));
  const topSubOutcomes = Array.from(subOutcomeCounts.entries())
    .map(([id, count]) => ({ code: codeBySubOutcomeId.get(id) ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const outcomeIds = Array.from(new Set((subOutcomes ?? []).map((s) => s.outcome_id)));
  const { data: outcomes } = outcomeIds.length
    ? await supabase.from("outcomes").select("id,topic_id").in("id", outcomeIds)
    : { data: [] };
  const topicIds = Array.from(new Set((outcomes ?? []).map((o) => o.topic_id)));
  const { data: topics } = topicIds.length
    ? await supabase.from("topics").select("id,unit_id").in("id", topicIds)
    : { data: [] };
  const unitIds = Array.from(new Set((topics ?? []).map((t) => t.unit_id)));
  const { data: units } = unitIds.length
    ? await supabase.from("units").select("id,title").in("id", unitIds)
    : { data: [] };

  const unitTitleById = new Map((units ?? []).map((u) => [u.id, u.title]));
  const unitIdByTopicId = new Map((topics ?? []).map((t) => [t.id, t.unit_id]));
  const topicIdByOutcomeId = new Map((outcomes ?? []).map((o) => [o.id, o.topic_id]));
  const outcomeIdBySubOutcomeId = new Map((subOutcomes ?? []).map((s) => [s.id, s.outcome_id]));

  const unitCounts = new Map<string, number>();
  for (const q of questions) {
    const outcomeId = outcomeIdBySubOutcomeId.get(q.sub_outcome_id);
    const topicId = outcomeId ? topicIdByOutcomeId.get(outcomeId) : undefined;
    const unitId = topicId ? unitIdByTopicId.get(topicId) : undefined;
    const unitTitle = unitId ? unitTitleById.get(unitId) : undefined;
    if (!unitTitle) continue;
    unitCounts.set(unitTitle, (unitCounts.get(unitTitle) ?? 0) + 1);
  }

  let weakestUnit: { title: string; count: number } | null = null;
  for (const [title, count] of unitCounts) {
    if (!weakestUnit || count > weakestUnit.count) weakestUnit = { title, count };
  }

  return { total: questions.length, topReason, weakestUnit, reasonDistribution, topSubOutcomes };
}

/** Öğretmenin kendisine bağlı tüm öğrencilerinin kayıtlarının analizi. */
export async function getDashboardStats(teacherId: string) {
  const supabase = await createClient();

  const { data: links } = await supabase.from("student_teacher").select("student_id").eq("teacher_id", teacherId);
  const studentIds = (links ?? []).map((l) => l.student_id);
  if (studentIds.length === 0) return emptyStats();

  const { data: rows } = await supabase
    .from("questions")
    .select("error_reason,sub_outcome_id")
    .in("student_id", studentIds);

  return computeStats(supabase, rows ?? []);
}

/** Öğrencinin yalnız kendi kayıtlarının analizi (RLS zaten auth.uid() ile sınırlar). */
export async function getStudentStats(studentId: string) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("questions")
    .select("error_reason,sub_outcome_id")
    .eq("student_id", studentId);

  return computeStats(supabase, rows ?? []);
}

/** Öğrencinin konu (topic) bazında en çok yanlış yaptığı alanlar, azalan sırada. */
export async function getStudentWeakTopics(studentId: string) {
  const supabase = await createClient();

  const { data: rows } = await supabase.from("questions").select("sub_outcome_id").eq("student_id", studentId);
  const questions = rows ?? [];
  if (questions.length === 0) return [];

  const subOutcomeIds = Array.from(new Set(questions.map((q) => q.sub_outcome_id)));
  const { data: subOutcomes } = await supabase.from("sub_outcomes").select("id,outcome_id").in("id", subOutcomeIds);

  const outcomeIds = Array.from(new Set((subOutcomes ?? []).map((s) => s.outcome_id)));
  const { data: outcomes } = outcomeIds.length
    ? await supabase.from("outcomes").select("id,topic_id").in("id", outcomeIds)
    : { data: [] };

  const topicIds = Array.from(new Set((outcomes ?? []).map((o) => o.topic_id)));
  const { data: topics } = topicIds.length
    ? await supabase.from("topics").select("id,title").in("id", topicIds)
    : { data: [] };

  const topicTitleById = new Map((topics ?? []).map((t) => [t.id, t.title]));
  const topicIdByOutcomeId = new Map((outcomes ?? []).map((o) => [o.id, o.topic_id]));
  const outcomeIdBySubOutcomeId = new Map((subOutcomes ?? []).map((s) => [s.id, s.outcome_id]));

  const counts = new Map<string, number>();
  for (const q of questions) {
    const outcomeId = outcomeIdBySubOutcomeId.get(q.sub_outcome_id);
    const topicId = outcomeId ? topicIdByOutcomeId.get(outcomeId) : undefined;
    const title = topicId ? topicTitleById.get(topicId) : undefined;
    if (!title) continue;
    counts.set(title, (counts.get(title) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count);
}
