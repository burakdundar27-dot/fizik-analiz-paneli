import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server Component / Server Action / Route Handler içinde kullanılır.
 * Next 15'te cookies() async → bu fonksiyon da async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component'ten cookie yazılamaz; oturum yenilemeyi
            // middleware zaten yapıyor. Sessiz geçmek doğru davranış.
          }
        },
      },
    }
  );
}

/** Oturumu doğrular ve profili döner. Yoksa null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, grade_level")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, email: user.email } : null;
}
