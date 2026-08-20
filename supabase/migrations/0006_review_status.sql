-- =====================================================================
-- 0006_review_status.sql — Öğretmen tarafı soru iş akışı durumu
-- (project-brain.md §3.4, §3.5, Karar #17, Faz 4.1). Migration'lar
-- append-only — eskiler düzenlenmez.
-- =====================================================================

-- ---------- 1. Yeni enum: question_status'tan bilinçli olarak AYRI
-- (aynı 'review_needed' etiketi iki farklı anlamda kullanılıyor — brain §3.5 uyarısı) ----------
create type question_review_status as enum (
  'review_needed',   -- 🔴 Derste bakılacak (varsayılan — yeni yüklenen)
  'needs_revision',  -- 🟡 Tekrar edilecek (öğretmen anlattı, ödev verdi)
  'resolved'          -- 🟢 Tamamlandı / Anlaşıldı (konu oturdu)
);

-- ---------- 2. questions.review_status kolonu ----------
alter table questions
  add column review_status question_review_status not null default 'review_needed';

comment on column questions.review_status is 'Öğretmenin soruyu ele alma durumu (workflow). questions.status (öğrencinin kendi notu) ile karıştırılmamalı — brain §3.4.';

-- ---------- 3. guard_question_columns()'u review_status'u koruyacak şekilde güncelle ----------
-- teacher_note ile aynı desen: öğrenci review_status'u değiştiremez, öğretmen değiştirebilir.
create or replace function public.guard_question_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_is_owner boolean := (old.student_id = auth.uid());
begin
  new.created_at := old.created_at;
  new.solved_at  := old.solved_at;

  if v_is_owner then
    if coalesce(new.teacher_note, '') <> coalesce(old.teacher_note, '') then
      raise exception 'Öğrenci öğretmen notunu değiştiremez.';
    end if;
    if new.review_status <> old.review_status then
      raise exception 'Öğrenci durum etiketini değiştiremez.';
    end if;
    new.student_id := old.student_id;
    new.image_path := old.image_path;
  else
    new.student_id     := old.student_id;
    new.sub_outcome_id := old.sub_outcome_id;
    new.image_path     := old.image_path;
    new.error_reason   := old.error_reason;
    new.status         := old.status;
    new.source         := old.source;
    new.student_note   := old.student_note;
    new.is_resolved    := old.is_resolved;
  end if;
  return new;
end;
$$;
