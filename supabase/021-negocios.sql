-- Pido y Ido 021: tipos de negocio nuevos (pollería con menú, carnicería con lista), logo del negocio
-- y la carpeta de fotos propias (lo mismo que 003-fotos.sql, por si no se pegó). Se puede ejecutar otra vez.

-- 1. Tipos nuevos
alter table public.restaurants drop constraint if exists restaurants_kind_chk;
alter table public.restaurants add constraint restaurants_kind_chk
  check (kind in ('restaurante', 'polleria', 'carniceria', 'drogueria', 'minimercado', 'licorera', 'floristeria', 'ferreteria', 'otro'));
do $$ begin
  if to_regclass('public.pronto_suggest') is not null then
    alter table public.pronto_suggest drop constraint if exists pronto_suggest_kind_check;
    alter table public.pronto_suggest add constraint pronto_suggest_kind_check
      check (kind in ('restaurante', 'polleria', 'carniceria', 'drogueria', 'minimercado', 'licorera', 'floristeria', 'ferreteria', 'otro'));
  end if;
end $$;

-- 2. La pollería tiene menú como un restaurante: place_order y el horario por defecto la tratan igual.
do $$
declare f record; src text;
begin
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('place_order', 'rest_abre', 'rest_cierra') loop
    src := pg_get_functiondef(f.oid);
    src := replace(src, 'r.kind <> ''restaurante''', 'r.kind not in (''restaurante'', ''polleria'')');
    src := replace(src, 'r.kind = ''restaurante''', 'r.kind in (''restaurante'', ''polleria'')');
    execute src;
  end loop;
end $$;

-- 3. Logo del negocio
alter table public.restaurants add column if not exists logo text not null default '';
grant update (logo) on public.restaurants to authenticated;

-- 4. Fotos propias (portada, logo, platos): carpeta pública "fotos", cada negocio sube solo a su carpeta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "fotos_insert_own_folder" on storage.objects;
create policy "fotos_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);
drop policy if exists "fotos_delete_own" on storage.objects;
create policy "fotos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);
