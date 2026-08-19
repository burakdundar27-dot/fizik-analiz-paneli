"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Mail, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signInWithPassword, signInWithMagicLink, type ActionState } from "../actions";
import { cn } from "@/lib/utils";

type Mode = "password" | "magic";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (!state?.error && !state?.success) return null;
  const isError = Boolean(state.error);
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-sm",
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      {state.error ?? state.success}
    </p>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<Mode>("password");
  const [pwState, pwAction] = useActionState(signInWithPassword, null);
  const [mlState, mlAction] = useActionState(signInWithMagicLink, null);

  const tab = (value: Mode, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      aria-pressed={mode === value}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        mode === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tab("password", <KeyRound className="size-4" />, "Şifre ile")}
        {tab("magic", <Mail className="size-4" />, "Şifresiz")}
      </div>

      {initialError && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {initialError}
        </p>
      )}

      {mode === "password" ? (
        <form action={pwAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ornek@okul.edu.tr" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Feedback state={pwState} />
          <SubmitButton>Giriş yap</SubmitButton>
        </form>
      ) : (
        <form action={mlAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ml-email">E-posta</Label>
            <Input id="ml-email" name="email" type="email" autoComplete="email" required placeholder="ornek@okul.edu.tr" />
            <p className="text-xs text-muted-foreground">
              Şifre olmadan, e-postana gelen tek kullanımlık bağlantıyla giriş yaparsın.
            </p>
          </div>
          <Feedback state={mlState} />
          <SubmitButton>Giriş bağlantısı gönder</SubmitButton>
        </form>
      )}
    </div>
  );
}
