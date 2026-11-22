-- Pido y Ido 017: listo para lanzar.
-- 1. Negocios nuevos quedan "en revisión" hasta que Pido y Ido los aprueba (columna aprobado).
-- 2. Nadie puede ponerse su propia comisión ni aprobarse solo.
-- 3. Un pedido cerrado (entregado, rechazado, cancelado...) ya no se puede cambiar desde la app.
-- 4. Límite contra pedidos falsos: máx. 3 pedidos abiertos y 6 por hora por cliente.
-- 5. Código de recuperación para el negocio que olvida su clave.
-- 6. Ajustes de seguridad que pide Supabase (search_path, permisos que sobran).
-- Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

-- ---------- 1. Aprobación de negocios ----------
alter table public.restaurants add column if not exists aprobado boolean not null default false;
-- Los negocios que ya existen hoy quedan aprobados (se ejecuta una sola vez).
do $$ begin
  if not exists (select 1 from pg_class where relname = 'pyi_017_done') then
    update public.restaurants set aprobado = true;
    create table public.pyi_017_done (at timestamptz default now());
    alter table public.pyi_017_done enable row level security;
    revoke all on public.pyi_017_done from anon, authenticated;
  end if;
end $$;

-- Los clientes solo ven negocios aprobados; el dueño siempre ve el suyo.
drop policy if exists "restaurants: todos ven" on public.restaurants;
create policy "restaurants: todos ven" on public.restaurants for select
  using (aprobado or owner = auth.uid());

-- ---------- 2. Valores que solo pone Pido y Ido ----------
-- security invoker a propósito: current_user es quien hace el cambio (la app = authenticated;
-- las funciones del sistema = postgres y pueden cambiar todo).
create or replace function public.restaurants_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.aprobado := false;
      new.comision_pct := 5;
      new.rating_sum := 0;
      new.rating_count := 0;
    else
      new.aprobado := old.aprobado;
      new.comision_pct := old.comision_pct;
      new.owner := old.owner;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.restaurants_guard() from public, anon, authenticated;
drop trigger if exists restaurants_guard on public.restaurants;
create trigger restaurants_guard before insert or update on public.restaurants
  for each row execute function public.restaurants_guard();

-- ---------- 3 y 4. Pedidos: límites y estados cerrados ----------
create or replace function public.orders_guard() returns trigger
language plpgsql set search_path = public as $$
declare n int;
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.restaurants where id = new.rest_id and aprobado) then
      raise exception 'not_approved';
    end if;
    if new.customer_uid is not null then
      select count(*) into n from public.orders
        where customer_uid = new.customer_uid and status in ('recibido', 'preparando', 'listo', 'en_camino')
          and created_at > now() - interval '12 hours';
      if n >= 3 then raise exception 'too_many_open'; end if;
      select count(*) into n from public.orders
        where customer_uid = new.customer_uid and created_at > now() - interval '1 hour';
      if n >= 6 then raise exception 'too_many'; end if;
    end if;
    return new;
  end if;
  -- UPDATE hecho directamente por el negocio desde la app (las funciones del sistema no pasan por aquí).
  if current_user in ('anon', 'authenticated') and new.status is distinct from old.status
     and old.status in ('entregado', 'rechazado', 'cancelado', 'no_entregado', 'sin_respuesta') then
    raise exception 'order_closed';
  end if;
  return new;
end $$;
revoke execute on function public.orders_guard() from public, anon, authenticated;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before insert or update on public.orders
  for each row execute function public.orders_guard();

-- ---------- 5. Código de recuperación de la clave ----------
create table if not exists public.rest_recovery (
  owner uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  fails int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.rest_recovery enable row level security;
revoke all on public.rest_recovery from anon, authenticated;

-- El dueño crea (o cambia) su código. Se muestra una sola vez.
create or replace function public.new_recovery_code() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare c text;
begin
  if not public.is_full_user() then raise exception 'not_allowed'; end if;
  c := upper(substr(translate(encode(gen_random_bytes(12), 'base64'), '+/=0O1lI', ''), 1, 8));
  insert into public.rest_recovery (owner, code_hash) values (auth.uid(), crypt(c, gen_salt('bf')))
    on conflict (owner) do update set code_hash = excluded.code_hash, fails = 0, updated_at = now();
  return c;
end $$;
revoke execute on function public.new_recovery_code() from public, anon;
grant execute on function public.new_recovery_code() to authenticated;

create or replace function public.has_recovery_code() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rest_recovery where owner = auth.uid())
$$;
revoke execute on function public.has_recovery_code() from public, anon;
grant execute on function public.has_recovery_code() to authenticated;

-- Nueva clave con el número de WhatsApp + el código. Después de 5 intentos malos se bloquea
-- (entonces Pido y Ido la cambia a mano).
create or replace function public.reset_clave(p_phone text, p_code text, p_pass text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare u uuid; rr public.rest_recovery;
begin
  if length(coalesce(p_pass, '')) < 6 then return 'clave_corta'; end if;
  select id into u from auth.users
    where email = 'r' || right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10) || '@pidoyido.app';
  if u is null then return 'no_existe'; end if;
  select * into rr from public.rest_recovery where owner = u for update;
  if rr.owner is null then return 'sin_codigo'; end if;
  if rr.fails >= 5 then return 'bloqueado'; end if;
  if rr.code_hash <> crypt(upper(btrim(coalesce(p_code, ''))), rr.code_hash) then
    update public.rest_recovery set fails = fails + 1 where owner = u;
    return 'incorrecto';
  end if;
  update auth.users set encrypted_password = crypt(p_pass, gen_salt('bf')), updated_at = now() where id = u;
  -- El código sirve una sola vez.
  delete from public.rest_recovery where owner = u;
  return 'ok';
end $$;
revoke execute on function public.reset_clave(text, text, text) from public;
grant execute on function public.reset_clave(text, text, text) to anon, authenticated;

-- ---------- 6. Ajustes de seguridad ----------
-- Funciones sin search_path fijo (aviso de Supabase).
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('is_full_user', 'rest_abierto', 'rest_abre', 'rest_cierra', 'horario_ok', 'rest_dia', 'rest_en_horario', 'km_between')
  loop
    execute format('alter function %s set search_path = public', f.sig);
  end loop;
end $$;
-- Permisos que la app nunca usa (TRUNCATE salta las reglas por fila).
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
-- Los visitantes sin cuenta no crean ni borran negocios.
revoke insert, delete on public.restaurants from anon;

notify pgrst, 'reload schema';
