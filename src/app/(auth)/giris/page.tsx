import Link from "next/link";
import { Atom } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Giriş — Fizik Analiz Paneli" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Atom className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Fizik Analiz Paneli</h1>
          <p className="text-sm text-muted-foreground">
            Yanlışlarını kazanım ve hata nedeni bazında takip et.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Giriş yap</CardTitle>
            <CardDescription>Hesabınla devam et.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm initialError={hata} />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="font-medium text-primary underline-offset-4 hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
