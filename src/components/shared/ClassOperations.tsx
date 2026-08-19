"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GRADE_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClass, joinClass, type ActionState } from "@/lib/actions/class-actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
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

function CreateClassForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createClass, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sınıf oluştur</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Sınıf adı</Label>
            <Input id="name" name="name" placeholder="11-A Fizik" maxLength={60} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="gradeLevel">Sınıf seviyesi</Label>
            <select
              id="gradeLevel"
              name="gradeLevel"
              required
              className="flex h-9 w-full rounded-lg border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}. sınıf
                </option>
              ))}
            </select>
          </div>

          <Feedback state={state} />
          <SubmitButton label="Oluştur" />
        </form>
      </CardContent>
    </Card>
  );
}

function JoinClassForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(joinClass, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sınıfa katıl</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="joinCode">Sınıf kodu</Label>
            <Input
              id="joinCode"
              name="joinCode"
              placeholder="AB2C3D"
              maxLength={6}
              required
              className="uppercase tracking-widest"
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase();
              }}
            />
          </div>

          <Feedback state={state} />
          <SubmitButton label="Katıl" />
        </form>
      </CardContent>
    </Card>
  );
}

export function ClassOperations({ role }: { role: "teacher" | "student" }) {
  return role === "teacher" ? <CreateClassForm /> : <JoinClassForm />;
}
