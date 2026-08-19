import Image from "next/image";
import { Card, Badge } from "@/components/ui/card";
import { ERROR_REASONS, QUESTION_STATUSES, type ErrorReason, type QuestionStatus } from "@/lib/constants";

export type QuestionCardProps = {
  imageUrl: string | null;
  title: string;
  createdAt: string;
  errorReason: ErrorReason;
  status: QuestionStatus;
};

export function QuestionCard({ imageUrl, title, createdAt, errorReason, status }: QuestionCardProps) {
  const errorMeta = ERROR_REASONS[errorReason];
  const statusMeta = QUESTION_STATUSES[status];

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill loading="lazy" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Görsel yok
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge className={errorMeta.className}>{errorMeta.short}</Badge>
          <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
        </div>
      </div>
    </Card>
  );
}
