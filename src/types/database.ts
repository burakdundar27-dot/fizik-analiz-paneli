/**
 * supabase/migrations/0001_init.sql + 0005_student_teacher.sql + 0006_review_status.sql şemasıyla elle doğrulanmıştır (alan alan eşleşir).
 * `npx supabase gen types` interaktif login gerektirdiğinden (headless ortamda
 * mümkün değil) buradan üretilemedi; istenirse şu komutla üretilip bu dosyanın
 * yerine konabilir — çıktı aynı şekli üretmelidir:
 *   npx supabase login && npx supabase gen types typescript --project-id lppwjmmfufopkqlcqvyt > src/types/database.ts
 */
import type { ErrorReason, QuestionReviewStatus, QuestionStatus, UserRole } from "@/lib/constants";

type Ref = { id: string; code: string; title: string; order_no: number | null; created_at: string };

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  grade_level: number | null;
  created_at: string;
};

export type StudentTeacher = {
  id: string;
  teacher_id: string;
  student_id: string;
  created_at: string;
};

export type Question = {
  id: string;
  student_id: string;
  sub_outcome_id: string;
  image_path: string;
  error_reason: ErrorReason;
  status: QuestionStatus;
  review_status: QuestionReviewStatus;
  source: string | null;
  student_note: string | null;
  teacher_note: string | null;
  is_resolved: boolean;
  solved_at: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Omit<Profile, "created_at">>;
      student_teacher: Table<StudentTeacher, Omit<StudentTeacher, "id" | "created_at">>;
      units: Table<Ref & { grade_level: number }>;
      topics: Table<Ref & { unit_id: string }>;
      outcomes: Table<Ref & { topic_id: string }>;
      sub_outcomes: Table<Ref & { outcome_id: string }>;
      questions: Table<
        Question,
        Omit<Question, "id" | "created_at" | "updated_at" | "solved_at" | "teacher_note" | "review_status">
      >;
    };
    Views: Record<never, never>;
    Functions: {
      link_student_by_email: {
        Args: { p_email: string };
        Returns: { student_id: string; full_name: string }[];
      };
    };
    Enums: {
      user_role: UserRole;
      error_reason: ErrorReason;
      question_status: QuestionStatus;
      question_review_status: QuestionReviewStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
