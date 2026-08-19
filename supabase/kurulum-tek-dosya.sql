-- =====================================================================
-- OTOMATIK URETILDI - supabase/migrations/000{1,2,3} birlestirilmis hali.
-- Tek seferde yapistirip calistirmak icin. Kaynak dosyalar degismezdir;
-- sema degisikligi icin yeni bir migration dosyasi ekle (brain 4.5/6).
-- Supabase Dashboard -> SQL Editor -> New query -> yapistir -> Run
-- =====================================================================

-- >>>>>>>>>>>>>>>>  0001_init.sql  <<<<<<<<<<<<<<<<

-- =====================================================================
-- 0001_init.sql â€” Enum'lar, tablolar, indeksler, trigger'lar
-- project-brain.md Â§3 ÅŸemasÄ±nÄ±n birebir karÅŸÄ±lÄ±ÄŸÄ±.
-- Ã‡alÄ±ÅŸtÄ±rma: Supabase Dashboard â†’ SQL Editor â†’ yapÄ±ÅŸtÄ±r â†’ Run
-- =====================================================================

-- ---------- 1. ENUM'LAR (Â§3.5) ----------
create type user_role as enum ('student', 'teacher');

create type error_reason as enum (
  'knowledge_gap',      -- Bilgi eksikliÄŸi
  'misconception',      -- Kavram yanÄ±lgÄ±sÄ±
  'calculation_error',  -- Ä°ÅŸlem hatasÄ±
  'misread_question',   -- Soruyu yanlÄ±ÅŸ okuma
  'diagram_error',      -- Åekil/grafik/diyagram hatasÄ±
  'unit_error',         -- Birim hatasÄ±
  'careless',           -- Dikkatsizlik
  'time_pressure'       -- SÃ¼re yetmedi
);

create type question_status as enum (
  'wrong',              -- YanlÄ±ÅŸ
  'blank',              -- BoÅŸ
  'lucky_guess',        -- DoÄŸru ama emin deÄŸil
  'review_needed'       -- Tekrar edilecek
);

-- ---------- 2. PROFILES (Â§3.1) ----------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'student',
  grade_level smallint check (grade_level between 9 and 12),
  created_at  timestamptz not null default now()
);

comment on table profiles is 'auth.users ile 1-1. Brain dosyasÄ±nda "students" olarak anÄ±lan yapÄ±; rol kolonuyla Ã¶ÄŸrenci/Ã¶ÄŸretmen ayrÄ±mÄ± yapÄ±lÄ±r.';

-- ---------- 3. SINIFLAR (Â§3.2) ----------
create table classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  teacher_id  uuid not null references profiles (id) on delete cascade,
  join_code   text not null unique check (char_length(join_code) = 6),
  grade_level smallint check (grade_level between 9 and 12),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table class_members (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique (class_id, student_id)
);

-- ---------- 4. KAZANIM HÄ°YERARÅÄ°SÄ° (Â§3.3) ----------
-- Ãœnite â†’ Konu â†’ KazanÄ±m â†’ Alt KazanÄ±m. Salt okunur referans verisi.
create table units (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- Ã¶rn. '9.3'
  title       text not null,
  grade_level smallint not null check (grade_level between 9 and 12),
  order_no    smallint,
  created_at  timestamptz not null default now()
);

create table topics (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references units (id) on delete cascade,
  code       text not null unique,           -- Ã¶rn. '9.3.1'
  title      text not null,
  order_no   smallint,
  created_at timestamptz not null default now()
);

create table outcomes (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references topics (id) on delete cascade,
  code       text not null unique,           -- Ã¶rn. '9.3.1.1'
  title      text not null,
  order_no   smallint,
  created_at timestamptz not null default now()
);

create table sub_outcomes (
  id         uuid primary key default gen_random_uuid(),
  outcome_id uuid not null references outcomes (id) on delete cascade,
  code       text not null unique,           -- Ã¶rn. '9.3.1.1.a'
  title      text not null,
  order_no   smallint,
  created_at timestamptz not null default now()
);

-- ---------- 5. QUESTIONS â€” ana tablo (Â§3.4) ----------
create table questions (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles (id) on delete cascade,
  class_id       uuid references classes (id) on delete set null,
  sub_outcome_id uuid not null references sub_outcomes (id) on delete restrict,
  image_path     text not null,              -- '{student_id}/{uuid}.webp' â€” tam URL DEÄÄ°L
  error_reason   error_reason not null,
  status         question_status not null default 'review_needed',
  source         text,                       -- 'TYT 2024', 'Ders kitabÄ± s.112'
  student_note   text,
  teacher_note   text,
  is_resolved    boolean not null default false,
  solved_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- 6. Ä°NDEKSLER (Â§3.6) ----------
create index questions_student_created_idx on questions (student_id, created_at desc);
create index questions_class_created_idx   on questions (class_id, created_at desc);
create index questions_sub_outcome_idx     on questions (sub_outcome_id);
create index questions_error_reason_idx    on questions (error_reason);
create index class_members_student_idx     on class_members (student_id);
create index topics_unit_idx               on topics (unit_id);
create index outcomes_topic_idx            on outcomes (topic_id);
create index sub_outcomes_outcome_idx      on sub_outcomes (outcome_id);

-- ---------- 7. TRIGGER: yeni kullanÄ±cÄ± â†’ profil ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, grade_level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student'),
    (new.raw_user_meta_data ->> 'grade_level')::smallint
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 8. TRIGGER: updated_at + solved_at ----------
create or replace function public.touch_question()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  -- is_resolved falseâ†’true olduÄŸunda Ã§Ã¶zÃ¼m zamanÄ±nÄ± damgala, tersinde temizle.
  if new.is_resolved and not old.is_resolved then
    new.solved_at := now();
  elsif not new.is_resolved and old.is_resolved then
    new.solved_at := null;
  end if;
  return new;
end;
$$;

create trigger questions_touch
  before update on questions
  for each row execute function public.touch_question();


-- >>>>>>>>>>>>>>>>  0002_rls.sql  <<<<<<<<<<<<<<<<

-- =====================================================================
-- 0002_rls.sql â€” Row Level Security (Â§3.7)
-- Ä°lke: yetki uygulamada DEÄÄ°L veritabanÄ±nda. Unutulan bir if veri sÄ±zdÄ±rÄ±r;
-- unutulan bir politika eriÅŸimi kapatÄ±r (gÃ¼venli taraf).
-- =====================================================================

-- ---------- 1. YARDIMCI FONKSÄ°YONLAR ----------
-- security definer: RLS'i baypas ederek okur â†’ politika iÃ§inde politika
-- tetiklenmez, sonsuz recursion olmaz. (brain Â§3.7 uyarÄ±sÄ±)

create or replace function public.my_role()
returns user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

-- Ä°stek yapan Ã¶ÄŸretmen, verilen Ã¶ÄŸrencinin sÄ±nÄ±flarÄ±ndan birinin Ã¶ÄŸretmeni mi?
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

-- KullanÄ±cÄ± bu sÄ±nÄ±fÄ±n Ã¼yesi mi (Ã¶ÄŸrenci) ya da Ã¶ÄŸretmeni mi?
create or replace function public.can_see_class(p_class uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid())
      or exists (select 1 from public.class_members where class_id = p_class and student_id = auth.uid())
$$;

-- ---------- 2. RLS'Ä° AÃ‡ ----------
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

-- ---------- 4. KAZANIM TABLOLARI: giriÅŸ yapan herkes okur, kimse yazmaz ----------
-- Yazma yalnÄ±z service_role ile (seed script) â€” service_role RLS'e tabi deÄŸildir.
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

-- ---------- 7. QUESTIONS â€” en kritik bÃ¶lÃ¼m ----------
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

-- ---------- 8. KOLON SEVÄ°YESÄ° KORUMA ----------
-- RLS kolon bazlÄ± kÄ±sÄ±tlama yapamaz: yukarÄ±daki UPDATE politikalarÄ± Ã¶ÄŸretmene
-- tÃ¼m satÄ±rÄ±, Ã¶ÄŸrenciye teacher_note'u da aÃ§Ä±k bÄ±rakÄ±r. Trigger ile kapatÄ±yoruz.
create or replace function public.guard_question_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_is_owner boolean := (old.student_id = auth.uid());
begin
  -- Bu iki alan hiÃ§bir rol tarafÄ±ndan elle yazÄ±lamaz.
  -- solved_at'i questions_touch trigger'Ä± yÃ¶netir (alfabetik olarak bundan SONRA Ã§alÄ±ÅŸÄ±r).
  new.created_at := old.created_at;
  new.solved_at  := old.solved_at;

  if v_is_owner then
    -- Ã–ÄŸrenci kendi kaydÄ±nda Ã¶ÄŸretmen notuna dokunamaz.
    if coalesce(new.teacher_note, '') <> coalesce(old.teacher_note, '') then
      raise exception 'Ã–ÄŸrenci Ã¶ÄŸretmen notunu deÄŸiÅŸtiremez.';
    end if;
    -- Sahiplik ve gÃ¶rsel yolu sabittir.
    new.student_id := old.student_id;
    new.image_path := old.image_path;
  else
    -- Ã–ÄŸretmen YALNIZ teacher_note yazabilir; diÄŸer her alan eski deÄŸerine dÃ¶ner.
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


-- >>>>>>>>>>>>>>>>  0003_storage.sql  <<<<<<<<<<<<<<<<

-- =====================================================================
-- 0003_storage.sql â€” Soru fotoÄŸraflarÄ± bucket'Ä± (Â§3.7)
-- Private bucket: Ã¶ÄŸrenci el yazÄ±sÄ±/fotoÄŸrafÄ± kiÅŸisel veridir.
-- GÃ¶rsel arayÃ¼zde createSignedUrl() ile gÃ¶sterilir.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  false,
  2097152,  -- 2 MB; client tarafÄ± 1600px/WebP sÄ±kÄ±ÅŸtÄ±rma sonrasÄ± ~500KB hedefler
  array['image/webp', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do nothing;

-- YÃ¼kleme: dosya yolu MUTLAKA '{auth.uid()}/...' ile baÅŸlamalÄ±.
-- storage.foldername(name)[1] â†’ yolun ilk klasÃ¶rÃ¼.
create policy "ogrenci kendi klasorune yukler" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'question-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ogrenci kendi gorselini okur" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'question-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ã–ÄŸretmen, kendi sÄ±nÄ±fÄ±ndaki Ã¶ÄŸrencinin klasÃ¶rÃ¼nÃ¼ okuyabilir.
create policy "ogretmen ogrencisinin gorselini okur" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'question-images'
    and public.is_teacher_of(((storage.foldername(name))[1])::uuid)
  );

create policy "ogrenci kendi gorselini siler" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'question-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

