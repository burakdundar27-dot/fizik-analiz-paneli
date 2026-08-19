"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createQuestionSchema, updateQuestionFeedbackSchema } from "@/lib/validations";
import { STORAGE_BUCKET } from "@/lib/constants";
import type { TablesInsert } from "@/types/database";

export type ActionState = { error?: string; success?: string } | null;

function firstError(issues: { message: string }[]) {
  return issues[0]?.message ?? "Geçersiz bilgi";
}

export async function createQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createQuestionSchema.safeParse({
    subOutcomeId: formData.get("subOutcomeId"),
    errorReason: formData.get("errorReason"),
    status: formData.get("status"),
    source: formData.get("source") ?? "",
    studentNote: formData.get("studentNote") ?? "",
    image: formData.get("image"),
  });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const { subOutcomeId, errorReason, status, source, studentNote, image } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturumun sona ermiş, tekrar giriş yap" };

  const imagePath = `${user.id}/${randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(imagePath, image, { contentType: "image/webp" });
  if (uploadError) return { error: "Fotoğraf yüklenemedi, tekrar dene" };

  const insert: TablesInsert<"questions"> = {
    student_id: user.id,
    sub_outcome_id: subOutcomeId,
    image_path: imagePath,
    error_reason: errorReason,
    status,
    source: source || null,
    student_note: studentNote || null,
    is_resolved: false,
  };

  const { error: insertError } = await supabase.from("questions").insert(insert);
  if (insertError) {
    await supabase.storage.from(STORAGE_BUCKET).remove([imagePath]);
    return { error: "Kayıt oluşturulamadı, tekrar dene" };
  }

  revalidatePath("/panel");
  return { success: "Soru kaydedildi." };
}

export async function updateQuestionFeedback(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateQuestionFeedbackSchema.safeParse({
    questionId: formData.get("questionId"),
    teacherNote: formData.get("teacherNote") ?? "",
  });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const { questionId, teacherNote } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturumun sona ermiş, tekrar giriş yap" };

  const { data, error } = await supabase
    .from("questions")
    .update({ teacher_note: teacherNote || null })
    .eq("id", questionId)
    .select("id,student_id");

  if (error || !data || data.length === 0) return { error: "Not kaydedilemedi, tekrar dene" };

  revalidatePath("/ogretmen");
  revalidatePath(`/ogretmen/ogrenci/${data[0].student_id}`);
  return { success: "Not kaydedildi." };
}
