import type { Database } from "@/types/database";

export type CurriculumUnit = Database["public"]["Tables"]["units"]["Row"];
export type CurriculumTopic = Database["public"]["Tables"]["topics"]["Row"];
export type CurriculumOutcome = Database["public"]["Tables"]["outcomes"]["Row"];
export type CurriculumSubOutcome = Database["public"]["Tables"]["sub_outcomes"]["Row"];

export type CurriculumData = {
  units: CurriculumUnit[];
  topics: CurriculumTopic[];
  outcomes: CurriculumOutcome[];
  subOutcomes: CurriculumSubOutcome[];
};

export type OutcomeSelectProps = {
  data: CurriculumData;
  value: string | null;
  onChange: (subOutcomeId: string | null) => void;
  gradeLevel?: number | null;
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
};

export type OutcomeNode = CurriculumOutcome & { subOutcomes: CurriculumSubOutcome[] };
export type TopicNode = CurriculumTopic & { outcomes: OutcomeNode[] };
export type UnitNode = CurriculumUnit & { topics: TopicNode[] };

export type OutcomePath = {
  unit: CurriculumUnit;
  topic: CurriculumTopic;
  outcome: CurriculumOutcome;
  subOutcome: CurriculumSubOutcome;
};

function byOrder<T extends { order_no: number | null; code: string }>(a: T, b: T) {
  return (a.order_no ?? 0) - (b.order_no ?? 0) || a.code.localeCompare(b.code);
}

export function buildCurriculumTree(data: CurriculumData, gradeLevel?: number | null): UnitNode[] {
  const units = gradeLevel ? data.units.filter((u) => u.grade_level === gradeLevel) : data.units;

  return units
    .map((unit) => ({
      ...unit,
      topics: data.topics
        .filter((t) => t.unit_id === unit.id)
        .map((topic) => ({
          ...topic,
          outcomes: data.outcomes
            .filter((o) => o.topic_id === topic.id)
            .map((outcome) => ({
              ...outcome,
              subOutcomes: data.subOutcomes
                .filter((s) => s.outcome_id === outcome.id)
                .sort(byOrder),
            }))
            .sort(byOrder),
        }))
        .sort(byOrder),
    }))
    .sort(byOrder);
}

export function findPathToSubOutcome(data: CurriculumData, subOutcomeId: string | null): OutcomePath | null {
  if (!subOutcomeId) return null;
  const subOutcome = data.subOutcomes.find((s) => s.id === subOutcomeId);
  if (!subOutcome) return null;
  const outcome = data.outcomes.find((o) => o.id === subOutcome.outcome_id);
  if (!outcome) return null;
  const topic = data.topics.find((t) => t.id === outcome.topic_id);
  if (!topic) return null;
  const unit = data.units.find((u) => u.id === topic.unit_id);
  if (!unit) return null;
  return { unit, topic, outcome, subOutcome };
}
