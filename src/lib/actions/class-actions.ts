"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createClassSchema, joinClassSchema } from "@/lib/validations";

export type ActionState = { error?: string; success?: string } | null;

function firstError(issues: { message: string }[]) {
  return issues[0]?.message ?? "Geçersiz bilgi";
}

/** 0/O/1/I hariç — okurken karışıklık yaratmasın. */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateJoinCode() {
  return Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
}

export async function createClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    gradeLevel: formData.get("gradeLevel"),
  });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const user = await getCurrentUser();
  if (!user) return { error: "Oturumun sona ermiş, tekrar giriş yap" };
  if (user.role !== "teacher") return { error: "Bu işlem için öğretmen yetkisi gerekli" };

  const supabase = await createClient();
  const { name, gradeLevel } = parsed.data;

  for (let attempt = 0; attempt < 3; attempt++) {
    const joinCode = generateJoinCode();
    const { error } = await supabase.from("classes").insert({
      name,
      teacher_id: user.id,
      join_code: joinCode,
      grade_level: gradeLevel,
      is_active: true,
    });

    if (!error) {
      revalidatePath("/ogretmen");
      return { success: `Sınıf oluşturuldu: ${joinCode}` };
    }
    if (error.code !== "23505") return { error: "Sınıf oluşturulamadı, tekrar dene" };
  }

  return { error: "Kod üretilemedi, tekrar dene" };
}

export async function joinClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = joinClassSchema.safeParse({ joinCode: formData.get("joinCode") });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturumun sona ermiş, tekrar giriş yap" };

  const { data, error } = await supabase
    .rpc("join_class_by_code", { p_join_code: parsed.data.joinCode.toUpperCase() })
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Bu sınıfa zaten üyesin" };
    return { error: "Geçersiz sınıf kodu" };
  }

  revalidatePath("/panel");
  return { success: `Sınıfa katıldın: ${data.class_name}` };
}
