import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic link ve e-posta doğrulama bağlantılarının indiği yer.
 * Supabase ?token_hash=...&type=... ile buraya yönlendirir.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) {
    redirect("/giris?hata=Bağlantı geçersiz");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    redirect("/giris?hata=Bağlantının süresi dolmuş, yeniden istek gönder");
  }

  // Oturum açıldı; kök sayfa rolü okuyup doğru panele yönlendirir.
  redirect("/");
}
