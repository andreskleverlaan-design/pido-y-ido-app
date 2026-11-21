-- Pido y Ido 011: promociones pagadas ("Patrocinado").
--   Un negocio compra un espacio por días en su pueblo:
--     banner = foto grande arriba en Inicio (máx. 3 a la vez por pueblo)
--     lista  = sale de primero en la lista "Cerca de ti" (máx. 2 a la vez por pueblo)
--   El negocio la pide desde su panel, paga por Nequi y toca "Ya pagué".
--   Tú la apruebas: Supabase > Table Editor > promos > columna estado = aprobado.
--   (Para rechazar: estado = rechazado y escribe el motivo en nota_admin.)
--   Precios en promo_precio() más abajo. El negocio no puede cambiar precio ni estado.
-- Necesita antes: setup.sql y la columna restaurants.town (008).
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

create table if not exists public.promos (
  id bigserial primary key,
  rest_id text not null references public.restaurants(id) on delete cascade,
  town text not null default 'Villanueva',
  tipo text not null check (tipo in ('banner', 'lista')),
  titulo text not null check (char_length(titulo) between 3 and 40),
  texto text not null default '' check (char_length(texto) <= 80),
  img text not null default '',
  inicio date not null,
  dias int not null check (dias in (7, 14, 30)),
  fin date not null,
  precio int not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado', 'cancelado')),
  pagado_at timestamptz,
  nota_admin text not null default '',
  vistas int not null default 0,
  toques int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists promos_town_fin on public.promos (town, fin);
create index if not exists promos_rest on public.promos (rest_id);

alter table public.promos enable row level security;
drop policy if exists promos_ver on public.promos;
-- Todos ven las aprobadas; el dueño ve también las suyas pendientes. Escribir solo con las funciones de abajo.
create policy promos_ver on public.promos for select
  using (estado = 'aprobado' or exists (select 1 from public.restaurants r where r.id = rest_id and r.owner = auth.uid()));
grant select on public.promos to anon, authenticated;

-- Precio en pesos (COP). Cambia aquí si quieres otros precios.
create or replace function public.promo_precio(p_tipo text, p_dias int) returns int
language sql immutable as $$
  select case p_tipo
    when 'banner' then case p_dias when 7 then 30000 when 14 then 55000 when 30 then 100000 end
    when 'lista'  then case p_dias when 7 then 15000 when 14 then 28000 when 30 then 50000 end
  end
$$;
create or replace function public.promo_cupos(p_tipo text) returns int
language sql immutable as $$ select case p_tipo when 'banner' then 3 when 'lista' then 2 else 0 end $$;

-- Cuántos espacios quedan libres en todos los días entre inicio y fin (una pendiente sin pagar guarda su espacio 48 horas).
create or replace function public.promo_libres(p_town text, p_tipo text, p_inicio date, p_dias int) returns int
language plpgsql stable security definer set search_path = public as $$
declare d date; mx int := 0; n int;
begin
  for d in select generate_series(p_inicio, p_inicio + p_dias - 1, interval '1 day')::date loop
    select count(*) into n from public.promos
     where town = p_town and tipo = p_tipo and d >= inicio and d < fin
       and (estado = 'aprobado' or (estado = 'pendiente' and (pagado_at is not null or created_at > now() - interval '48 hours')));
    if n > mx then mx := n; end if;
  end loop;
  return greatest(public.promo_cupos(p_tipo) - mx, 0);
end $$;

create or replace function public.promo_disponible(p_tipo text, p_inicio date, p_dias int) returns int
language plpgsql stable security definer set search_path = public as $$
declare v_town text;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  select coalesce(town, 'Villanueva') into v_town from public.restaurants where owner = auth.uid() order by created_at limit 1;
  if v_town is null then raise exception 'no_restaurant'; end if;
  return public.promo_libres(v_town, p_tipo, p_inicio, p_dias);
end $$;

create or replace function public.promo_solicitar(p_tipo text, p_titulo text, p_texto text, p_img text, p_inicio date, p_dias int) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_rest text; v_town text; v_hoy date := (now() at time zone 'America/Bogota')::date; v_precio int; v_id bigint;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  select id, coalesce(town, 'Villanueva') into v_rest, v_town from public.restaurants where owner = auth.uid() order by created_at limit 1;
  if v_rest is null then raise exception 'no_restaurant'; end if;
  v_precio := public.promo_precio(p_tipo, p_dias);
  if v_precio is null then raise exception 'bad_promo'; end if;
  if p_inicio is null or p_inicio < v_hoy or p_inicio > v_hoy + 60 then raise exception 'bad_date'; end if;
  if char_length(coalesce(trim(p_titulo), '')) < 3 then raise exception 'bad_title'; end if;
  if (select count(*) from public.promos where rest_id = v_rest and estado = 'pendiente') >= 3 then raise exception 'too_many'; end if;
  perform pg_advisory_xact_lock(hashtext('promo:' || v_town || ':' || p_tipo));
  if public.promo_libres(v_town, p_tipo, p_inicio, p_dias) < 1 then raise exception 'sin_cupo'; end if;
  insert into public.promos (rest_id, town, tipo, titulo, texto, img, inicio, dias, fin, precio)
  values (v_rest, v_town, p_tipo, left(trim(p_titulo), 40), left(trim(coalesce(p_texto, '')), 80), left(coalesce(p_img, ''), 500), p_inicio, p_dias, p_inicio + p_dias, v_precio)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'precio', v_precio);
end $$;

create or replace function public.promo_pagado(p_id bigint) returns void
language sql volatile security definer set search_path = public as $$
  update public.promos p set pagado_at = coalesce(p.pagado_at, now())
   where p.id = p_id and p.estado = 'pendiente'
     and exists (select 1 from public.restaurants r where r.id = p.rest_id and r.owner = auth.uid());
$$;
create or replace function public.promo_cancelar(p_id bigint) returns void
language sql volatile security definer set search_path = public as $$
  update public.promos p set estado = 'cancelado'
   where p.id = p_id and p.estado = 'pendiente'
     and exists (select 1 from public.restaurants r where r.id = p.rest_id and r.owner = auth.uid());
$$;

-- Contadores para el negocio: cuántas veces se vio y cuántas veces la tocaron.
create or replace function public.promo_visto(p_ids bigint[]) returns void
language sql volatile security definer set search_path = public as $$
  update public.promos set vistas = vistas + 1 where id = any(p_ids[1:20]) and estado = 'aprobado';
$$;
create or replace function public.promo_toque(p_id bigint) returns void
language sql volatile security definer set search_path = public as $$
  update public.promos set toques = toques + 1 where id = p_id and estado = 'aprobado';
$$;

revoke all on function public.promo_libres(text, text, date, int) from public, anon, authenticated;
revoke all on function public.promo_disponible(text, date, int) from public, anon;
revoke all on function public.promo_solicitar(text, text, text, text, date, int) from public, anon;
revoke all on function public.promo_pagado(bigint) from public, anon;
revoke all on function public.promo_cancelar(bigint) from public, anon;
revoke all on function public.promo_visto(bigint[]) from public, anon;
revoke all on function public.promo_toque(bigint) from public, anon;
grant execute on function public.promo_disponible(text, date, int) to authenticated;
grant execute on function public.promo_solicitar(text, text, text, text, date, int) to authenticated;
grant execute on function public.promo_pagado(bigint) to authenticated;
grant execute on function public.promo_cancelar(bigint) to authenticated;
grant execute on function public.promo_visto(bigint[]) to authenticated;
grant execute on function public.promo_toque(bigint) to authenticated;

-- Para ti: lista de lo que falta aprobar (Table Editor > promos_por_aprobar, o SQL: select * from promos_por_aprobar;)
create or replace view public.promos_por_aprobar with (security_invoker = true) as
  select p.id, r.name as negocio, p.town, p.tipo, p.titulo, p.inicio, p.fin, p.precio,
         case when p.pagado_at is not null then 'dice que pagó' else 'sin pagar' end as pago, p.pagado_at, p.created_at
    from public.promos p join public.restaurants r on r.id = p.rest_id
   where p.estado = 'pendiente' order by p.pagado_at nulls last, p.created_at;
revoke all on public.promos_por_aprobar from anon, authenticated;
