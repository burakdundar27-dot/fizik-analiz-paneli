/** client.ts ve server.ts ortak env doğrulaması. Eksikse "fetch failed" gibi
 *  anlaşılmaz bir hata yerine hangi değişkenin eksik olduğunu net söyler. */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Supabase ortam değişkenleri eksik: ${missing}. .env.local dosyasını kontrol et ve dev sunucusunu yeniden başlat (Vercel'de Project Settings → Environment Variables).`
    );
  }

  return { url, anonKey };
}
