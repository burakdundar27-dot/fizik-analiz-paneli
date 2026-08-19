"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { linkStudent, type ActionState } from "@/lib/actions/student-teacher-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
      Ekle
    </Button>
  );
}

export function AddStudentForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(linkStudent, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Öğrenci ekle</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="email">Öğrencinin e-postası</Label>
            <Input id="email" name="email" type="email" required placeholder="ogrenci@ornek.com" />
          </div>
          <SubmitButton />
        </form>

        {(state?.error || state?.success) && (
          <p
            role="status"
            className={cn(
              "mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm",
              state.error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            )}
          >
            {state.error ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            )}
            {state.error ?? state.success}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
