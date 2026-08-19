"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { linkStudentSchema } from "@/lib/validations";

export type ActionState = { error?: string; success?: string } | null;

function firstError(issues: { message: string }[]) {
  return issues[0]?.message ?? "Geçersiz bilgi";
}

export async function linkStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = linkStudentSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const user = await getCurrentUser();
  if (!user) return { error: "Oturumun sona ermiş, tekrar giriş yap" };
  if (user.role !== "teacher") return { error: "Bu işlem için öğretmen yetkisi gerekli" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("link_student_by_email", { p_email: parsed.data.email })
    .single();

  if (error) return { error: error.message.includes("bulunamadı") ? error.message : "Öğrenci eklenemedi, tekrar dene" };

  revalidatePath("/ogretmen");
  return { success: `${data.full_name} eklendi.` };
}
