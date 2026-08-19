/**
 * Enum → Türkçe etiket + renk eşlemesi. TEK KAYNAK (brain §3.5, §4.3).
 * Kural: aynı hata nedeni her ekranda aynı renk.
 */

export type ErrorReason =
  | "knowledge_gap"
  | "misconception"
  | "calculation_error"
  | "misread_question"
  | "diagram_error"
  | "unit_error"
  | "careless"
  | "time_pressure";

export type QuestionStatus = "wrong" | "blank" | "lucky_guess" | "review_needed";
export type UserRole = "student" | "teacher";

type Meta = { label: string; short: string; className: string; hint: string };

export const ERROR_REASONS: Record<ErrorReason, Meta> = {
  misconception: {
    label: "Kavram yanılgısı",
    short: "Kavram",
    className: "bg-red-50 text-red-700 border-red-200",
    hint: "Yanlış biliyorum — kafamdaki kural fizikte doğru olan değil",
  },
  knowledge_gap: {
    label: "Bilgi eksikliği",
    short: "Bilgi",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    hint: "Bu konuyu hiç bilmiyorum",
  },
  calculation_error: {
    label: "İşlem hatası",
    short: "İşlem",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    hint: "Yolu biliyordum ama matematikte hata yaptım",
  },
  diagram_error: {
    label: "Şekil / diyagram hatası",
    short: "Diyagram",
    className: "bg-violet-50 text-violet-700 border-violet-200",
    hint: "Serbest cisim diyagramı, grafik ya da şekli yanlış çizdim/okudum",
  },
  unit_error: {
    label: "Birim hatası",
    short: "Birim",
    className: "bg-teal-50 text-teal-700 border-teal-200",
    hint: "Birim çevirmeyi atladım ya da yanlış birimle işlem yaptım",
  },
  misread_question: {
    label: "Soruyu yanlış okuma",
    short: "Okuma",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    hint: "Soru kökünü ya da verilenleri yanlış anladım",
  },
  careless: {
    label: "Dikkatsizlik",
    short: "Dikkat",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    hint: "Biliyordum, dalgınlıkla yanlış işaretledim",
  },
  time_pressure: {
    label: "Süre yetmedi",
    short: "Süre",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
    hint: "Yapabilirdim ama zaman kalmadı",
  },
};

/** Recharts hex karşılıkları — ERROR_REASONS ile aynı renk ailesi (brain §4.3). */
export const ERROR_REASON_HEX: Record<ErrorReason, string> = {
  misconception: "#dc2626",
  knowledge_gap: "#ea580c",
  calculation_error: "#d97706",
  diagram_error: "#7c3aed",
  unit_error: "#0d9488",
  misread_question: "#0284c7",
  careless: "#2563eb",
  time_pressure: "#71717a",
};

export const QUESTION_STATUSES: Record<QuestionStatus, Omit<Meta, "short">> = {
  wrong: {
    label: "Yanlış yaptım",
    className: "bg-red-50 text-red-700 border-red-200",
    hint: "Bir cevap işaretledim, yanlıştı",
  },
  blank: {
    label: "Boş bıraktım",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
    hint: "Hiç işaretlemedim",
  },
  lucky_guess: {
    label: "Doğru ama emin değildim",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    hint: "Tuttu ama neden doğru olduğunu bilmiyorum",
  },
  review_needed: {
    label: "Tekrar edilecek",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    hint: "Bu soruya tekrar dönmem gerek",
  },
};

export const USER_ROLES: Record<UserRole, string> = {
  student: "Öğrenci",
  teacher: "Öğretmen",
};

export const GRADE_LEVELS = [9, 10, 11, 12] as const;

/** Rolüne göre giriş sonrası açılacak sayfa. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  student: "/panel",
  teacher: "/ogretmen",
};

/** Görsel yükleme sınırları (brain §4.4). */
export const IMAGE_RULES = {
  maxEdge: 1600,
  quality: 0.8,
  maxBytes: 2 * 1024 * 1024,
  accept: ["image/jpeg", "image/png", "image/webp", "image/heic"],
} as const;

export const STORAGE_BUCKET = "question-images";

/** Yardımcı: Record'u <select>/grid için diziye çevirir. */
export function asList<T extends string, V>(rec: Record<T, V>) {
  return (Object.keys(rec) as T[]).map((value) => ({ value, ...rec[value] }));
}
