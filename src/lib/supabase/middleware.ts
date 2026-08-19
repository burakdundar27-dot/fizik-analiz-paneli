import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Oturum çerezini yeniler ve kullanıcıyı döner.
 * .env.local doldurulmamışsa fırlatmaz: `configured: false` döner ki proxy
 * yığın izi yerine /saglik sayfasına yönlendirebilsin.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { response, user: null, configured: false };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() çağrısı zorunlu: token'ı sunucuda doğrular ve yeniler.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, configured: true };
}
