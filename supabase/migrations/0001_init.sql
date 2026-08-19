-- =====================================================================
-- 0001_init.sql — Enum'lar, tablolar, indeksler, trigger'lar
-- project-brain.md §3 şemasının birebir karşılığı.
-- Çalıştırma: Supabase Dashboard → SQL Editor → yapıştır → Run
-- =====================================================================

-- ---------- 1. ENUM'LAR (§3.5) ----------
create type user_role as enum ('student', 'teacher');

create type error_reason as enum (
  'knowledge_gap',      -- Bilgi eksikliği
  'misconception',      -- Kavram yanılgısı
  'calculation_error',  -- İşlem hatası
  'misread_question',   -- Soruyu yanlış okuma
  'diagram_error',      -- Şekil/grafik/diyagram hatası
  'unit_error',         -- Birim hatası
  'careless',           -- Dikkatsizlik
  'time_pressure'       -- Süre yetmedi
);

create type question_status as enum (
  'wrong',              -- Yanlış
  'blank',              -- Boş
  'lucky_guess',        -- Doğru ama emin değil
  'review_needed'       -- Tekrar edilecek
);

-- ---------- 2. PROFILES (§3.1) ----------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'student',
  grade_level smallint check (grade_level between 9 and 12),
  created_at  timestamptz not null default now()
);

comment on table profiles is 'auth.users ile 1-1. Brain dosyasında "students" olarak anılan yapı; rol kolonuyla öğrenci/öğretmen ayrımı yapılır.';

-- ---------- 3. SINIFLAR (§3.2) ----------
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

-- ---------- 4. KAZANIM HİYERARŞİSİ (§3.3) ----------
-- Ünite → Konu → Kazanım → Alt Kazanım. Salt okunur referans verisi.
create table units (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- örn. '9.3'
  title       text not null,
  grade_level smallint not null check (grade_level between 9 and 12),
  order_no    smallint,
  created_at  timestamptz not null default now()
);

create table topics (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references units (id) on delete cascade,
  code       text not null unique,           -- örn. '9.3.1'
  title      text not null,
  order_no   smallint,
  created_at timestamptz not null default now()
);

create table outcomes (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references topics (id) on delete cascade,
  code       text not null unique,           -- örn. '9.3.1.1'
  title      text not null,
  order_no   smallint,
  created_at timestamptz not null default now()
);

create table sub_outcomes (
  id         uuid primary key default gen_random_uuid(),
  outcome_id uuid not null references outcomes (id) on delete cascade,
  code       text not null unique,           -- örn. '9.3.1.1.a'
  title      text not null,
  order_no   smallint,
  created_at timestamptz not null default now()
);

-- ---------- 5. QUESTIONS — ana tablo (§3.4) ----------
create table questions (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles (id) on delete cascade,
  class_id       uuid references classes (id) on delete set null,
  sub_outcome_id uuid not null references sub_outcomes (id) on delete restrict,
  image_path     text not null,              -- '{student_id}/{uuid}.webp' — tam URL DEĞİL
  error_reason   error_reason not null,
  status         question_status not null default 'review_needed',
  source         text,                       -- 'TYT 2024', 'Ders kitabı s.112'
  student_note   text,
  teacher_note   text,
  is_resolved    boolean not null default false,
  solved_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- 6. İNDEKSLER (§3.6) ----------
create index questions_student_created_idx on questions (student_id, created_at desc);
create index questions_class_created_idx   on questions (class_id, created_at desc);
create index questions_sub_outcome_idx     on questions (sub_outcome_id);
create index questions_error_reason_idx    on questions (error_reason);
create index class_members_student_idx     on class_members (student_id);
create index topics_unit_idx               on topics (unit_id);
create index outcomes_topic_idx            on outcomes (topic_id);
create index sub_outcomes_outcome_idx      on sub_outcomes (outcome_id);

-- ---------- 7. TRIGGER: yeni kullanıcı → profil ----------
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
  -- is_resolved false→true olduğunda çözüm zamanını damgala, tersinde temizle.
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
