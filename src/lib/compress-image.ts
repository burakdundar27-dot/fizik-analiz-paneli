/** Fotoğrafı client-side sıkıştırır: en uzun kenar maxEdge, WebP quality, <=maxBytes (brain §4.4). */

export type CompressImageOptions = { maxEdge: number; quality: number; maxBytes: number };

export type CompressImageResult =
  | { ok: true; file: File }
  | {
      ok: false;
      reason: "unsupported_type" | "decode_failed" | "canvas_failed" | "too_large_after_compression";
    };

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

function toWebpFileName(name: string) {
  const withoutExt = name.replace(/\.[^./\\]+$/, "");
  return `${withoutExt || "photo"}.webp`;
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/webp", quality));
}

function draw(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function compressImage(
  file: File,
  opts: CompressImageOptions
): Promise<CompressImageResult> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, reason: "unsupported_type" };
  }

  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = new Image();
    img.src = objectUrl;
    await img.decode();
  } catch {
    URL.revokeObjectURL(objectUrl);
    return { ok: false, reason: "decode_failed" };
  }
  URL.revokeObjectURL(objectUrl);

  const scale = Math.min(1, opts.maxEdge / Math.max(img.width, img.height));
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  let canvas = draw(img, targetW, targetH);
  if (!canvas) return { ok: false, reason: "canvas_failed" };

  let blob: Blob | null = null;
  for (let quality = opts.quality; quality >= 0.4; quality -= 0.1) {
    blob = await encode(canvas, quality);
    if (blob && blob.size <= opts.maxBytes) break;
  }

  if (!blob || blob.size > opts.maxBytes) {
    canvas = draw(img, Math.round(targetW * 0.75), Math.round(targetH * 0.75));
    if (!canvas) return { ok: false, reason: "canvas_failed" };
    blob = await encode(canvas, 0.6);
  }

  if (!blob || blob.size > opts.maxBytes) {
    return { ok: false, reason: "too_large_after_compression" };
  }

  return { ok: true, file: new File([blob], toWebpFileName(file.name), { type: "image/webp" }) };
}
