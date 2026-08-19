"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IMAGE_RULES } from "@/lib/constants";
import { compressImage, type CompressImageResult } from "@/lib/compress-image";

export type ImageUploaderProps = {
  onFileReady: (compressedFile: File) => void;
  onClear?: () => void;
  disabled?: boolean;
  previewUrl?: string | null;
};

type Phase = "idle" | "compressing" | "ready" | "error";

const COMPRESS_ERROR_MESSAGES: Record<Exclude<CompressImageResult, { ok: true }>["reason"], string> = {
  unsupported_type: "Desteklenmeyen dosya türü. JPEG, PNG, WEBP ya da HEIC seç.",
  decode_failed: "Fotoğraf açılamadı. Başka bir dosya seçmeyi dene.",
  canvas_failed: "Fotoğraf işlenemedi. Başka bir dosya seçmeyi dene.",
  too_large_after_compression: "Fotoğraf sıkıştırıldıktan sonra hâlâ çok büyük. Daha küçük bir fotoğraf dene.",
};

export function ImageUploader({ onFileReady, onClear, disabled, previewUrl }: ImageUploaderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(previewUrl ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  async function handleFile(file: File) {
    setErrorMessage(null);
    if (!(IMAGE_RULES.accept as readonly string[]).includes(file.type)) {
      setErrorMessage(COMPRESS_ERROR_MESSAGES.unsupported_type);
      setPhase("error");
      return;
    }
    setPhase("compressing");
    const result = await compressImage(file, {
      maxEdge: IMAGE_RULES.maxEdge,
      quality: IMAGE_RULES.quality,
      maxBytes: IMAGE_RULES.maxBytes,
    });
    if (!result.ok) {
      setErrorMessage(COMPRESS_ERROR_MESSAGES[result.reason]);
      setPhase("error");
      return;
    }
    const url = URL.createObjectURL(result.file);
    setPreviewObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setPhase("ready");
    onFileReady(result.file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function handleReset() {
    setPreviewObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setErrorMessage(null);
    setPhase("idle");
    onClear?.();
  }

  const isBusy = disabled || phase === "compressing";

  return (
    <Card className="p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_RULES.accept.join(",")}
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {phase === "ready" && previewObjectUrl ? (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewObjectUrl}
            alt="Yüklenecek soru fotoğrafı önizlemesi"
            className="aspect-video w-full rounded-lg object-cover"
          />
          <div className="flex items-center justify-between">
            <Badge className="border-primary/20 bg-primary/10 text-primary">Hazır</Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fotoğrafı kaldır"
              disabled={disabled}
              onClick={handleReset}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !isBusy && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (!isBusy && (e.key === "Enter" || e.key === " ")) fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isBusy) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => !isBusy && handleDrop(e)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-zinc-200",
            phase === "error" && "border-red-200",
            isBusy && "pointer-events-none opacity-70"
          )}
        >
          {phase === "compressing" ? (
            <>
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm">Sıkıştırılıyor…</p>
            </>
          ) : (
            <>
              <Upload
                className={cn("size-6", isDragOver ? "text-primary" : "text-muted-foreground")}
                aria-hidden="true"
              />
              <p className="text-sm">Fotoğraf sürükle ya da seç</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP, HEIC · en fazla 2MB</p>
            </>
          )}
        </div>
      )}

      {phase === "error" && errorMessage && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setPhase("idle")}>
            Tekrar dene
          </Button>
        </div>
      )}

      {phase !== "ready" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          className="mt-3"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="size-4" aria-hidden="true" />
          Kameradan çek
        </Button>
      )}
    </Card>
  );
}
