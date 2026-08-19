import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next 16'da "middleware" dosya konvansiyonu "proxy" olarak yeniden adlandırıldı.
 * Görev: oturum çerezini yenilemek + giriş kapısı.
 */

/** Giriş gerektirmeyen yollar. /saglik burada: hesap açmadan bağlantı doğrulanabilsin.
 * /dev-test geçicidir — Faz 3 bileşen testi bitince /dev-test sayfasıyla birlikte silinecek. */
const PUBLIC_PATHS = ["/giris", "/kayit", "/auth", "/saglik", "/dev-test"];

export default async function proxy(request: NextRequest) {
  const { response, user, configured } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // .env.local henüz doldurulmamış: her isteği teşhis sayfasına gönder.
  if (!configured) {
    if (pathname === "/saglik") return response;
    const url = request.nextUrl.clone();
    url.pathname = "/saglik";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Oturum yok, korumalı sayfa → girişe gönder.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Oturum var, giriş/kayıt sayfası → köke gönder (kök rolü okuyup yönlendirir).
  if (user && (pathname === "/giris" || pathname === "/kayit")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Rol bazlı kontrol burada DEĞİL layout'larda: bu dosya her istekte çalışır,
  // ek DB sorgusu pahalıdır (brain §4.1).
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
