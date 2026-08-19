-- =====================================================================
-- 0005_student_teacher.sql — Sınıf yapısını kaldırır, yerine öğretmen-öğrenci
-- birebir ilişki tablosunu (student_teacher) kurar (project-brain.md §3.2,
-- Karar #13/#15/#16). Migration'lar append-only — eskiler düzenlenmez.
-- =====================================================================

-- ---------- 1. student_teacher tablosu (önce oluşturulmalı — is_teacher_of()
-- SQL dilinde yazıldığı için CREATE anında bu tabloya referans doğrulanır) ----------
create table student_teacher (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

comment on table student_teacher is 'Özel ders ilişkisi: öğretmen hangi öğrencilere bağlı. classes/class_members yerine geçti (brain §3.2, Karar #15).';

create index student_teacher_teacher_idx on student_teacher (teacher_id);
create index student_teacher_student_idx on student_teacher (student_id);

alter table student_teacher enable row level security;

create policy "ogretmen kendi baglarini okur" on student_teacher
  for select to authenticated using (teacher_id = auth.uid());

create policy "ogrenci kendi bagini okur" on student_teacher
  for select to authenticated using (student_id = auth.uid());

create policy "ogretmen ogrenci baglar" on student_teacher
  for insert to authenticated
  with check (teacher_id = auth.uid() and public.my_role() = 'teacher');

create policy "ogretmen bagi siler" on student_teacher
  for delete to authenticated using (teacher_id = auth.uid());

-- ---------- 2. is_teacher_of()'u student_teacher'a göre yeniden tanımla ----------
-- Bunu değiştirince classes/class_members'a olan bağımlılığı kopar
-- ve o tabloları aşağıda sorunsuz DROP edebiliriz.
create or replace function public.is_teacher_of(p_student uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.student_teacher
    where student_id = p_student and teacher_id = auth.uid()
  )
$$;

-- ---------- 3. guard_question_columns()'dan class_id referansını çıkar ----------
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

-- ---------- 4. questions.class_id kolonunu kaldır (bağlı index otomatik gider) ----------
alter table questions drop column class_id;

-- ---------- 5. Sınıf tablolarını kaldır (policy'ler tabloyla birlikte gider —
-- can_see_class()'a bağlı politika da böylece önce kalkmış olur) ----------
drop table if exists class_members cascade;
drop table if exists classes cascade;

-- ---------- 6. join_code akışını kaldır (artık hiçbir politika bağlı değil) ----------
drop function if exists public.join_class_by_code(text);
drop function if exists public.can_see_class(uuid);

-- ---------- 7. Öğretmenin öğrenciyi e-posta ile bağlaması ----------
-- join_class_by_code ile aynı desen: security definer, RLS'i baypas etmez,
-- yalnızca kontrollü şekilde genişletir (auth.users.email normalde okunamaz).
create or replace function public.link_student_by_email(p_email text)
returns table (student_id uuid, full_name text)
language plpgsql security definer set search_path = public
as $$
declare
  v_student_id uuid;
  v_full_name text;
begin
  if public.my_role() <> 'teacher' then
    raise exception 'Bu işlem için öğretmen yetkisi gerekli';
  end if;

  select u.id, p.full_name into v_student_id, v_full_name
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(p_email) and p.role = 'student';

  if v_student_id is null then
    raise exception 'Bu e-postayla kayıtlı öğrenci bulunamadı';
  end if;

  insert into public.student_teacher (teacher_id, student_id)
  values (auth.uid(), v_student_id)
  on conflict (teacher_id, student_id) do nothing;

  return query select v_student_id, v_full_name;
end;
$$;

revoke all on function public.link_student_by_email(text) from public;
grant execute on function public.link_student_by_email(text) to authenticated;

-- ---------- 8. Storage: öğretmen-öğrenci görsel erişimi zaten is_teacher_of()
-- üzerinden çalışıyordu (0003_storage.sql) — fonksiyon güncellendiği için
-- bu politika ek değişiklik gerektirmeden yeni modele geçti.
