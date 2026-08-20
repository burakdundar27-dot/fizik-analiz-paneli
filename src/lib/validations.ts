import { z } from "zod";
import { IMAGE_RULES } from "@/lib/constants";

/** Tek şema, iki taraf: hem form hem Server Action aynı kuralı kullanır (brain §4.1/3). */

const email = z
  .string()
  .min(1, "E-posta gerekli")
  .email("Geçerli bir e-posta adresi gir");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Şifre gerekli"),
});

export const magicLinkSchema = z.object({ email });

export const signUpSchema = z.object({
  email,
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  fullName: z.string().min(3, "Ad soyad en az 3 karakter olmalı").max(80),
  // Öğretmen kaydı formdan kapalı: tek öğretmen hesabı elle oluşturuldu.
  role: z.literal("student", { message: "Şu an yalnız öğrenci kaydı açık" }),
  gradeLevel: z.coerce.number().int().min(9).max(12).optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export const createQuestionSchema = z.object({
  subOutcomeId: z.string().min(1, "Alt kazanım seç"),
  errorReason: z.enum(
    [
      "knowledge_gap",
      "misconception",
      "calculation_error",
      "misread_question",
      "diagram_error",
      "unit_error",
      "careless",
      "time_pressure",
    ],
    { message: "Hata nedeni seç" }
  ),
  status: z.enum(["wrong", "blank", "lucky_guess", "review_needed"], {
    message: "Durum seç",
  }),
  source: z.string().max(200).optional().or(z.literal("")),
  studentNote: z.string().max(500).optional().or(z.literal("")),
  image: z
    .instanceof(File, { message: "Fotoğraf gerekli" })
    .refine((f) => f.size > 0, "Fotoğraf gerekli")
    .refine((f) => f.size <= IMAGE_RULES.maxBytes, "Fotoğraf çok büyük")
    .refine(
      (f) => (IMAGE_RULES.accept as readonly string[]).includes(f.type) || f.type === "image/webp",
      "Desteklenmeyen dosya türü"
    ),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const linkStudentSchema = z.object({ email });

export type LinkStudentInput = z.infer<typeof linkStudentSchema>;

export const updateQuestionFeedbackSchema = z.object({
  questionId: z.string().min(1, "Soru bulunamadı"),
  teacherNote: z.string().max(1000, "Not en fazla 1000 karakter olabilir").optional().or(z.literal("")),
});

export type UpdateQuestionFeedbackInput = z.infer<typeof updateQuestionFeedbackSchema>;

export const updateReviewStatusSchema = z.object({
  questionId: z.string().min(1, "Soru bulunamadı"),
  reviewStatus: z.enum(["review_needed", "needs_revision", "resolved"], {
    message: "Geçersiz durum",
  }),
});

export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
