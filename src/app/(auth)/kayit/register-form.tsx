"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { GRADE_LEVELS } from "@/lib/constants";
import { signUp } from "../actions";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      Kayıt ol
    </Button>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(signUp, null);

  // Kayıt başarılıysa formu gizle: kullanıcı e-postasını kontrol etmeli.
  if (state?.success) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Ad Soyad</Label>
        <Input id="fullName" name="fullName" required placeholder="Burak Dündar" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">En az 8 karakter.</p>
      </div>

      <input type="hidden" name="role" value="student" />

      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeLevel">Sınıf</Label>
        <Select id="gradeLevel" name="gradeLevel" defaultValue="">
          <option value="">Seç (isteğe bağlı)</option>
          {GRADE_LEVELS.map((g) => (
            <option key={g} value={g}>
              {g}. sınıf
            </option>
          ))}
        </Select>
      </div>

      {state?.error && (
        <p
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          )}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
