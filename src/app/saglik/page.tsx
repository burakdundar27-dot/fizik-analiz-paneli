import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sağlık kontrolü" };
export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string };

/** Faz 1 kabul kriteri: bu sayfada her satır yeşil olmalı. */
export default async function HealthPage() {
  const checks: Check[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_URL",
    ok: Boolean(url),
    detail: url ? url : ".env.local içinde boş",
  });
  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: Boolean(anon),
    detail: anon ? `${anon.slice(0, 12)}…` : ".env.local içinde boş",
  });

  if (url && anon) {
    // sub_outcomes: anon kullanıcı için RLS SELECT politikası "authenticated"
    // olduğundan boş döner; önemli olan bağlantının ve tablonun var olması.
    const supabase = await createClient();
    const { error } = await supabase.from("sub_outcomes").select("id").limit(1);
    // PGRST205 = tablo yok. Bağlantı kurulmuş demektir; eksik olan migration.
    const tablesMissing = error?.code === "PGRST205";
    checks.push({
      label: "Veritabanı tabloları",
      ok: !error,
      detail: tablesMissing
        ? "Bağlantı var ama tablolar yok — supabase/migrations altındaki 3 dosyayı çalıştır"
        : error
          ? `${error.code ?? ""} ${error.message}`.trim()
          : "Şema hazır (sub_outcomes erişilebilir)",
    });

    // Oturum yokken AuthSessionMissingError beklenen durumdur, hata değil.
    const { error: authError } = await supabase.auth.getUser();
    const noSession = authError?.name === "AuthSessionMissingError";
    checks.push({
      label: "Auth servisi",
      ok: !authError || noSession,
      detail: noSession
        ? "Yanıt veriyor (şu an oturum açık değil — normal)"
        : authError
          ? authError.message
          : "Yanıt veriyor, oturum açık",
    });
  }

  const allOk = checks.every((c) => c.ok);

  return (
    <main className="mx-auto flex min-h-svh max-w-lg items-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Sağlık kontrolü</CardTitle>
          <CardDescription>
            {allOk ? "Tüm kontroller geçti — Faz 1 tamam." : "Eksik yapılandırma var."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {checks.map((c) => (
            <div key={c.label} className="flex items-start gap-3 rounded-lg border p-3">
              {c.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="break-all text-xs text-muted-foreground">{c.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
