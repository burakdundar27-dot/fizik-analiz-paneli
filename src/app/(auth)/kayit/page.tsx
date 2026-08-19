import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Kayıt — Fizik Analiz Paneli" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hesap oluştur</CardTitle>
            <CardDescription>Öğrenci ya da öğretmen olarak kayıt ol.</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Hesabın var mı?{" "}
          <Link href="/giris" className="font-medium text-primary underline-offset-4 hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
