-- =====================================================================
-- 0003_storage.sql — Soru fotoğrafları bucket'ı (§3.7)
-- Private bucket: öğrenci el yazısı/fotoğrafı kişisel veridir.
-- Görsel arayüzde createSignedUrl() ile gösterilir.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  false,
  2097152,  -- 2 MB; client tarafı 1600px/WebP sıkıştırma sonrası ~500KB hedefler
  array['image/webp', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do nothing;

-- Yükleme: dosya yolu MUTLAKA '{auth.uid()}/...' ile başlamalı.
-- storage.foldername(name)[1] → yolun ilk klasörü.
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

-- Öğretmen, kendi sınıfındaki öğrencinin klasörünü okuyabilir.
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
