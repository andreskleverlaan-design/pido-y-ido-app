-- Pido y Ido 003: restaurants upload their own photos (cover + dishes).
-- Public bucket "fotos": anyone can view, only a logged-in restaurant can upload, only into its own folder.
-- Max 1 MB per photo (the app shrinks photos to ~100-200 KB before upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "fotos_insert_own_folder" on storage.objects;
create policy "fotos_insert_own_folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists "fotos_delete_own" on storage.objects;
create policy "fotos_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );
