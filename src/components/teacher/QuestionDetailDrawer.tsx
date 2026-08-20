"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { QuestionCard, type QuestionCardProps } from "@/components/question/QuestionCard";
import {
  ERROR_REASONS,
  QUESTION_STATUSES,
  QUESTION_REVIEW_STATUSES,
  QUESTION_REVIEW_STATUS_ORDER,
  type QuestionReviewStatus,
} from "@/lib/constants";
import { updateQuestionFeedback, setReviewStatus, type ActionState } from "@/lib/actions/question-actions";
import { cn } from "@/lib/utils";

export type TeacherQuestion = QuestionCardProps & { id: string; studentNote: string | null; teacherNote: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      Notu kaydet
    </Button>
  );
}

function ReviewStatusButtons({ questionId, current }: { questionId: string; current: QuestionReviewStatus }) {
  const router = useRouter();
  const [reviewStatus, setLocalReviewStatus] = useState(current);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(next: QuestionReviewStatus) {
    if (next === reviewStatus || isPending) return;
    setError(null);
    startTransition(async () => {
      const res = await setReviewStatus(questionId, next);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setLocalReviewStatus(next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">Öğretmen durumu</p>
      <div className="flex flex-wrap gap-1.5">
        {QUESTION_REVIEW_STATUS_ORDER.map((key) => {
          const meta = QUESTION_REVIEW_STATUSES[key];
          const isActive = reviewStatus === key;
          return (
            <button
              key={key}
              type="button"
              disabled={isPending}
              aria-pressed={isActive}
              onClick={() => handleClick(key)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isActive ? meta.className : "border-zinc-200 text-muted-foreground hover:bg-muted"
              )}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

function Drawer({ question, onClose }: { question: TeacherQuestion; onClose: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateQuestionFeedback, null);
  const errorMeta = ERROR_REASONS[question.errorReason];
  const statusMeta = QUESTION_STATUSES[question.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{question.title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat">
            <X className="size-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          {question.imageUrl ? (
            <Image src={question.imageUrl} alt={question.title} fill className="object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Görsel yok</div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge className={errorMeta.className}>{errorMeta.label}</Badge>
          <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
        </div>

        <ReviewStatusButtons questionId={question.id} current={question.reviewStatus} />

        {question.studentNote && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Öğrenci notu</p>
            <p>{question.studentNote}</p>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="questionId" value={question.id} />
          <label htmlFor="teacherNote" className="text-xs font-medium text-muted-foreground">
            Öğretmen notu
          </label>
          <textarea
            id="teacherNote"
            name="teacherNote"
            defaultValue={question.teacherNote ?? ""}
            rows={4}
            maxLength={1000}
            className="rounded-lg border bg-background p-2 text-sm"
          />
          {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

export function TeacherQuestionCard({ question }: { question: TeacherQuestion }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <QuestionCard {...question} />
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Detay / Not Ekle
      </Button>
      {open && <Drawer question={question} onClose={() => setOpen(false)} />}
    </div>
  );
}
