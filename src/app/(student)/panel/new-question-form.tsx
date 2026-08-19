"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OutcomeSelect } from "@/components/questions/outcome-select";
import { ImageUploader } from "@/components/questions/image-uploader";
import type { CurriculumData } from "@/components/questions/outcome-select.types";
import { ERROR_REASONS, QUESTION_STATUSES, asList, type ErrorReason, type QuestionStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createQuestion, type ActionState } from "@/lib/actions/question-actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      Soruyu kaydet
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

function BadgeGrid<T extends string>({
  items,
  value,
  onChange,
  disabled,
}: {
  items: { value: T; label: string; className: string; hint: string }[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(item.value)}
          title={item.hint}
          aria-pressed={value === item.value}
          className={cn(
            "rounded-lg border p-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            value === item.value ? item.className : "border-zinc-200 text-muted-foreground hover:bg-muted"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function NewQuestionForm({
  data,
  gradeLevel,
  classId,
}: {
  data: CurriculumData;
  gradeLevel?: number | null;
  classId?: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createQuestion, null);
  const [subOutcomeId, setSubOutcomeId] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState<ErrorReason | null>(null);
  const [status, setStatus] = useState<QuestionStatus | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const canSubmit = Boolean(subOutcomeId && errorReason && status && image);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subOutcomeId || !errorReason || !status || !image || !formRef.current) return;

    const fd = new FormData(formRef.current);
    fd.set("subOutcomeId", subOutcomeId);
    fd.set("errorReason", errorReason);
    fd.set("status", status);
    fd.set("image", image);
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="classId" value={classId ?? ""} />
      <ImageUploader onFileReady={setImage} onClear={() => setImage(null)} />

      <OutcomeSelect
        data={data}
        value={subOutcomeId}
        onChange={setSubOutcomeId}
        gradeLevel={gradeLevel}
        error={data.subOutcomes.length === 0 ? "Kayıtlı müfredat bulunamadı." : null}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hata nedeni</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeGrid items={asList(ERROR_REASONS)} value={errorReason} onChange={setErrorReason} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Durum</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeGrid items={asList(QUESTION_STATUSES)} value={status} onChange={setStatus} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Label htmlFor="source">Kaynak (opsiyonel)</Label>
        <Input id="source" name="source" placeholder="TYT 2024, Ders kitabı s.112…" maxLength={200} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="studentNote">Not (opsiyonel)</Label>
        <textarea
          id="studentNote"
          name="studentNote"
          maxLength={500}
          rows={3}
          className="flex w-full rounded-lg border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          placeholder="Kendi yorumun…"
        />
      </div>

      <Feedback state={state} />
      <SubmitButton disabled={!canSubmit} />
      <Badge className="self-start border-transparent text-muted-foreground">
        {[subOutcomeId && "kazanım", errorReason && "hata nedeni", status && "durum", image && "fotoğraf"]
          .filter(Boolean)
          .length}/4 tamamlandı
      </Badge>
    </form>
  );
}
