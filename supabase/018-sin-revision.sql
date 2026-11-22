-- Pido y Ido 018: los negocios nuevos salen de una vez (sin revisión manual), con un interruptor
-- para volver a la aprobación a mano más adelante. Pido y Ido puede ocultar o mostrar negocios
-- desde su página de administración (#/admin/<clave>).
-- Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

-- Todos visibles, también los que estaban esperando.
alter table public.restaurants alter column aprobado set default true;
-- La primera vez: todos los que esperaban quedan visibles.
do $$ begin
  if to_regclass('public.pyi_admin_log') is null then update public.restaurants set aprobado = true where not aprobado; end if;
end $$;

-- Interruptor: auto_visible = true → los negocios nuevos salen de una vez; false → esperan a Pido y Ido.
create table if not exists public.pyi_settings (id int primary key default 1 check (id = 1), auto_visible boolean not null default true);
alter table public.pyi_settings enable row level security;
revoke all on public.pyi_settings from anon, authenticated;
insert into public.pyi_settings (id) values (1) on conflict (id) do nothing;

-- Un negocio nuevo sale según el interruptor; después solo Pido y Ido lo oculta o lo muestra.
create or replace function public.restaurants_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.aprobado := public.pyi_auto_visible(); new.comision_pct := 5; new.rating_sum := 0; new.rating_count := 0;
    else
      new.aprobado := old.aprobado; new.comision_pct := old.comision_pct; new.owner := old.owner;
    end if;
  end if;
  return new;
end $$;

-- Clave de administración (solo se guarda cifrada). Cambia PON-AQUI-TU-CLAVE por una clave larga y secreta.
create table if not exists public.pyi_admin (id int primary key default 1 check (id = 1), key_hash text not null);
alter table public.pyi_admin enable row level security;
revoke all on public.pyi_admin from anon, authenticated;
insert into public.pyi_admin (id, key_hash) values (1, extensions.crypt('PON-AQUI-TU-CLAVE', extensions.gen_salt('bf')))
  on conflict (id) do nothing;

create table if not exists public.pyi_admin_log (at timestamptz not null default now(), rest_id text not null, visible boolean not null);
alter table public.pyi_admin_log enable row level security;
revoke all on public.pyi_admin_log from anon, authenticated;

create or replace function public.admin_ok(p_key text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.pyi_admin where key_hash = crypt(coalesce(p_key, ''), key_hash))
$$;
revoke execute on function public.admin_ok(text) from public, anon, authenticated;

-- El guardia corre como el usuario de la app: necesita poder leer el interruptor.
create or replace function public.pyi_auto_visible() returns boolean
language sql stable security definer set search_path = public as $$ select coalesce((select auto_visible from public.pyi_settings where id = 1), true) $$;
revoke execute on function public.pyi_auto_visible() from public, anon;
grant execute on function public.pyi_auto_visible() to authenticated;

-- Lista de todos los negocios para Pido y Ido.
create or replace function public.admin_list(p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name, 'kind', r.kind, 'town', r.town, 'visible', r.aprobado, 'open', r.open,
      'created_at', r.created_at, 'address', r.address, 'phone', c.phone,
      'dishes', jsonb_array_length(coalesce(r.dishes, '[]'::jsonb)),
      'pedidos', (select count(*) from public.orders o where o.rest_id = r.id),
      'entregados', (select count(*) from public.orders o where o.rest_id = r.id and o.status = 'entregado'))
    order by r.created_at desc)
    from public.restaurants r left join public.rest_contact c on c.rest_id = r.id), '[]'::jsonb);
end $$;
revoke execute on function public.admin_list(text) from public;
grant execute on function public.admin_list(text) to anon, authenticated;

-- Ocultar o volver a mostrar un negocio.
create or replace function public.admin_set_visible(p_key text, p_id text, p_visible boolean) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  update public.restaurants set aprobado = p_visible where id = p_id;
  if not found then return 'no_existe'; end if;
  insert into public.pyi_admin_log (rest_id, visible) values (p_id, p_visible);
  return 'ok';
end $$;
revoke execute on function public.admin_set_visible(text, text, boolean) from public;
grant execute on function public.admin_set_visible(text, text, boolean) to anon, authenticated;

-- Leer y cambiar el interruptor.
create or replace function public.admin_settings(p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  return jsonb_build_object('auto_visible', public.pyi_auto_visible());
end $$;
revoke execute on function public.admin_settings(text) from public;
grant execute on function public.admin_settings(text) to anon, authenticated;

create or replace function public.admin_set_auto(p_key text, p_on boolean) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  update public.pyi_settings set auto_visible = p_on where id = 1;
  return 'ok';
end $$;
revoke execute on function public.admin_set_auto(text, boolean) from public;
grant execute on function public.admin_set_auto(text, boolean) to anon, authenticated;

notify pgrst, 'reload schema';
