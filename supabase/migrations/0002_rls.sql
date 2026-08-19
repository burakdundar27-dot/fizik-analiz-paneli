-- =====================================================================
-- 0002_rls.sql — Row Level Security (§3.7)
-- İlke: yetki uygulamada DEĞİL veritabanında. Unutulan bir if veri sızdırır;
-- unutulan bir politika erişimi kapatır (güvenli taraf).
-- =====================================================================

-- ---------- 1. YARDIMCI FONKSİYONLAR ----------
-- security definer: RLS'i baypas ederek okur → politika içinde politika
-- tetiklenmez, sonsuz recursion olmaz. (brain §3.7 uyarısı)

create or replace function public.my_role()
returns user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

-- İstek yapan öğretmen, verilen öğrencinin sınıflarından birinin öğretmeni mi?
create or replace function public.is_teacher_of(p_student uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.student_id = p_student
      and c.teacher_id = auth.uid()
  )
$$;

-- Kullanıcı bu sınıfın üyesi mi (öğrenci) ya da öğretmeni mi?
create or replace function public.can_see_class(p_class uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid())
      or exists (select 1 from public.class_members where class_id = p_class and student_id = auth.uid())
$$;

-- ---------- 2. RLS'İ AÇ ----------
alter table profiles      enable row level security;
alter table classes       enable row level security;
alter table class_members enable row level security;
alter table units         enable row level security;
alter table topics        enable row level security;
alter table outcomes      enable row level security;
alter table sub_outcomes  enable row level security;
alter table questions     enable row level security;

-- ---------- 3. PROFILES ----------
create policy "kendi profilini okur" on profiles
  for select to authenticated using (id = auth.uid());

create policy "ogretmen ogrencisinin profilini okur" on profiles
  for select to authenticated using (public.is_teacher_of(id));

create policy "kendi profilini gunceller" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- 4. KAZANIM TABLOLARI: giriş yapan herkes okur, kimse yazmaz ----------
-- Yazma yalnız service_role ile (seed script) — service_role RLS'e tabi değildir.
create policy "kazanimlar okunur" on units        for select to authenticated using (true);
create policy "kazanimlar okunur" on topics       for select to authenticated using (true);
create policy "kazanimlar okunur" on outcomes     for select to authenticated using (true);
create policy "kazanimlar okunur" on sub_outcomes for select to authenticated using (true);

-- ---------- 5. CLASSES ----------
create policy "ogretmen kendi sinifini okur" on classes
  for select to authenticated using (teacher_id = auth.uid());

create policy "ogrenci uyesi oldugu sinifi okur" on classes
  for select to authenticated
  using (exists (select 1 from class_members where class_id = classes.id and student_id = auth.uid()));

create policy "ogretmen sinif olusturur" on classes
  for insert to authenticated
  with check (teacher_id = auth.uid() and public.my_role() = 'teacher');

create policy "ogretmen kendi sinifini gunceller" on classes
  for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "ogretmen kendi sinifini siler" on classes
  for delete to authenticated using (teacher_id = auth.uid());

-- ---------- 6. CLASS_MEMBERS ----------
create policy "uyelikleri gorur" on class_members
  for select to authenticated
  using (student_id = auth.uid() or public.can_see_class(class_id));

create policy "ogrenci kendini siniza ekler" on class_members
  for insert to authenticated with check (student_id = auth.uid());

create policy "ogrenci ayrilir ogretmen cikarir" on class_members
  for delete to authenticated
  using (student_id = auth.uid()
         or exists (select 1 from classes where id = class_id and teacher_id = auth.uid()));

-- ---------- 7. QUESTIONS — en kritik bölüm ----------
create policy "ogrenci kendi sorularini okur" on questions
  for select to authenticated using (student_id = auth.uid());

create policy "ogretmen ogrencisinin sorularini okur" on questions
  for select to authenticated using (public.is_teacher_of(student_id));

create policy "ogrenci kendi adina kayit ekler" on questions
  for insert to authenticated with check (student_id = auth.uid());

create policy "ogrenci kendi kaydini gunceller" on questions
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "ogretmen ogrencisinin kaydini gunceller" on questions
  for update to authenticated
  using (public.is_teacher_of(student_id)) with check (public.is_teacher_of(student_id));

create policy "ogrenci kendi kaydini siler" on questions
  for delete to authenticated using (student_id = auth.uid());

-- ---------- 8. KOLON SEVİYESİ KORUMA ----------
-- RLS kolon bazlı kısıtlama yapamaz: yukarıdaki UPDATE politikaları öğretmene
-- tüm satırı, öğrenciye teacher_note'u da açık bırakır. Trigger ile kapatıyoruz.
create or replace function public.guard_question_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_is_owner boolean := (old.student_id = auth.uid());
begin
  -- Bu iki alan hiçbir rol tarafından elle yazılamaz.
  -- solved_at'i questions_touch trigger'ı yönetir (alfabetik olarak bundan SONRA çalışır).
  new.created_at := old.created_at;
  new.solved_at  := old.solved_at;

  if v_is_owner then
    -- Öğrenci kendi kaydında öğretmen notuna dokunamaz.
    if coalesce(new.teacher_note, '') <> coalesce(old.teacher_note, '') then
      raise exception 'Öğrenci öğretmen notunu değiştiremez.';
    end if;
    -- Sahiplik ve görsel yolu sabittir.
    new.student_id := old.student_id;
    new.image_path := old.image_path;
  else
    -- Öğretmen YALNIZ teacher_note yazabilir; diğer her alan eski değerine döner.
    new.student_id     := old.student_id;
    new.class_id       := old.class_id;
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

create trigger questions_guard_columns
  before update on questions
  for each row execute function public.guard_question_columns();
