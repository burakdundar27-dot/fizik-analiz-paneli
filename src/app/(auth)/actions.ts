"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema, magicLinkSchema } from "@/lib/validations";
// Not: "use server" dosyasında yalnız async export olabilir; rol→sayfa
// eşlemesi doğrudan HOME_BY_ROLE üzerinden layout/page içinde yapılıyor.

export type ActionState = { error?: string; success?: string } | null;

/** zod hatalarını tek satır Türkçe mesaja indirir. */
function firstError(issues: { message: string }[]) {
  return issues[0]?.message ?? "Geçersiz bilgi";
}

/** Supabase'in İngilizce hata mesajlarını Türkçeleştirir. */
function trAuthError(message: string) {
  if (message.includes("Invalid login credentials")) return "E-posta veya şifre hatalı";
  if (message.includes("Email not confirmed")) return "E-postanı doğrulaman gerekiyor";
  if (message.includes("already registered")) return "Bu e-posta zaten kayıtlı";
  if (message.includes("rate limit") || message.includes("60 seconds"))
    return "Çok sık denedin, bir dakika sonra tekrar dene";
  if (message.includes("fetch failed")) return "Sunucuya ulaşılamadı, birazdan tekrar dene";
  return message;
}

/**
 * Supabase'e ağ seviyesinde ulaşılamadığında (yanlış URL/anahtar, DNS,
 * bağlantı kopukluğu) auth-js hatayı {error} olarak döndürmez, fırlatır.
 * Bunu yakalayıp sunucu logunda teşhis edilebilir bilgi bırakır ve
 * Türkçeleştirilmiş hata mesajını (varsa) döner, başarılıysa null döner.
 *
 * DİKKAT: redirect() de bir throw ile çalışır — bu fonksiyon yalnız
 * Supabase çağrısını sarmalı, çağıran yerdeki redirect()'i asla içine almamalı.
 */
async function runAuthCall(
  label: string,
  action: () => Promise<{ error: { message: string } | null }>
): Promise<string | null> {
  try {
    const { error } = await action();
    return error ? trAuthError(error.message) : null;
  } catch (err) {
    console.error(`[auth:${label}] beklenmeyen hata:`, err);
    const message = err instanceof Error ? err.message : String(err);
    return trAuthError(message);
  }
}

export async function signInWithPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const error = await runAuthCall("signIn", async () => {
    const supabase = await createClient();
    return supabase.auth.signInWithPassword(parsed.data);
  });
  if (error) return { error };

  revalidatePath("/", "layout");
  redirect("/"); // Kök sayfa rolü okuyup doğru panele yönlendirir.
}

export async function signInWithMagicLink(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = magicLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const error = await runAuthCall("magicLink", async () => {
    const supabase = await createClient();
    return supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        // Yeni kullanıcıyı sessizce oluşturmayız: ad-soyad ve rol olmadan
        // profil satırı anlamsız olur. Kayıt akışı ayrıdır.
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    });
  });
  if (error) return { error };

  return { success: "Giriş bağlantısı e-postana gönderildi. Bağlantı 1 saat geçerli." };
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = signUpSchema.safeParse({
    ...raw,
    gradeLevel: raw.gradeLevel === "" ? undefined : raw.gradeLevel,
  });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const { email, password, fullName, role, gradeLevel } = parsed.data;

  // full_name / role / grade_level → raw_user_meta_data; handle_new_user()
  // trigger'ı bunları okuyup profiles satırını oluşturur (0001_init.sql §7).
  const error = await runAuthCall("signUp", async () => {
    const supabase = await createClient();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, grade_level: gradeLevel ?? null },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    });
  });
  if (error) return { error };

  return {
    success:
      "Kayıt alındı. E-postana gelen doğrulama bağlantısına tıkladıktan sonra giriş yapabilirsin.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/giris");
}
