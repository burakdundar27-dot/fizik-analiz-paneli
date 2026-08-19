-- =====================================================================
-- 0004_join_class_fn.sql — join_code ile sınıfa katılma (§3.7 deseni)
-- Öğrenci üye olmadan classes tablosunu göremez (RLS), bu yüzden lookup +
-- insert tek security definer fonksiyonda yapılır — RLS baypas edilmez,
-- yalnızca kontrollü şekilde genişletilir.
-- =====================================================================

create or replace function public.join_class_by_code(p_join_code text)
returns table (class_id uuid, class_name text)
language plpgsql security definer set search_path = public
as $$
declare
  v_class_id uuid;
  v_class_name text;
begin
  select id, name into v_class_id, v_class_name
  from public.classes
  where join_code = upper(p_join_code) and is_active = true;

  if v_class_id is null then
    raise exception 'Geçersiz sınıf kodu';
  end if;

  insert into public.class_members (class_id, student_id)
  values (v_class_id, auth.uid());

  return query select v_class_id, v_class_name;
end;
$$;

revoke all on function public.join_class_by_code(text) from public;
grant execute on function public.join_class_by_code(text) to authenticated;
