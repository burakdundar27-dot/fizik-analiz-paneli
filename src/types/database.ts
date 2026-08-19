/**
 * supabase/migrations/0001_init.sql şemasıyla elle doğrulanmıştır (alan alan eşleşir).
 * `npx supabase gen types` interaktif login gerektirdiğinden (headless ortamda
 * mümkün değil) buradan üretilemedi; istenirse şu komutla üretilip bu dosyanın
 * yerine konabilir — çıktı aynı şekli üretmelidir:
 *   npx supabase login && npx supabase gen types typescript --project-id lppwjmmfufopkqlcqvyt > src/types/database.ts
 */
import type { ErrorReason, QuestionStatus, UserRole } from "@/lib/constants";

type Ref = { id: string; code: string; title: string; order_no: number | null; created_at: string };

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  grade_level: number | null;
  created_at: string;
};

export type Class = {
  id: string;
  name: string;
  teacher_id: string;
  join_code: string;
  grade_level: number | null;
  is_active: boolean;
  created_at: string;
};

export type Question = {
  id: string;
  student_id: string;
  class_id: string | null;
  sub_outcome_id: string;
  image_path: string;
  error_reason: ErrorReason;
  status: QuestionStatus;
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
      classes: Table<Class, Omit<Class, "id" | "created_at">>;
      class_members: Table<{ id: string; class_id: string; student_id: string; joined_at: string }>;
      units: Table<Ref & { grade_level: number }>;
      topics: Table<Ref & { unit_id: string }>;
      outcomes: Table<Ref & { topic_id: string }>;
      sub_outcomes: Table<Ref & { outcome_id: string }>;
      questions: Table<
        Question,
        Omit<Question, "id" | "created_at" | "updated_at" | "solved_at" | "teacher_note">
      >;
    };
    Views: Record<never, never>;
    Functions: {
      join_class_by_code: {
        Args: { p_join_code: string };
        Returns: { class_id: string; class_name: string }[];
      };
    };
    Enums: {
      user_role: UserRole;
      error_reason: ErrorReason;
      question_status: QuestionStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
