-- Pido y Ido 010: resumen del mes para cada negocio.
--   El negocio ve cuántos pedidos le llegaron por la app en un mes, cuántos clientes eran nuevos,
--   cuántos volvieron a pedir, cuánto vendió y cuánto es la comisión de Pido y Ido.
--   La comisión es 5% por defecto. Para un "fundador" pon otra cifra en Table Editor > restaurants > comision_pct
--   (por ejemplo 0 el primer mes, luego 4.5). El negocio no puede cambiarla.
-- Necesita antes: setup.sql y 006-clientes-fieles.sql.
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

alter table public.restaurants
  add column if not exists comision_pct numeric(4, 2) not null default 5 check (comision_pct >= 0 and comision_pct <= 30);

-- p_mes = 'AAAA-MM' (mes en hora de Colombia). Solo cuenta pedidos entregados.
-- Un cliente es "nuevo" si ese mes fue su primer pedido entregado en este negocio (por celular; si no hay, por su cuenta).
create or replace function public.rest_resumen_mes(p_mes text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_rest text; v_pct numeric;
  v_ini timestamptz; v_fin timestamptz; v_pini timestamptz;
  res jsonb;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  if p_mes is null or p_mes !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then raise exception 'bad_month'; end if;
  select id, comision_pct into v_rest, v_pct from public.restaurants where owner = auth.uid() order by created_at limit 1;
  if v_rest is null then raise exception 'no_restaurant'; end if;

  v_ini := ((p_mes || '-01')::date)::timestamp at time zone 'America/Bogota';
  v_fin := ((p_mes || '-01')::date + interval '1 month')::timestamp at time zone 'America/Bogota';
  v_pini := ((p_mes || '-01')::date - interval '1 month')::timestamp at time zone 'America/Bogota';

  with todo as (
    select o.id, o.subtotal, o.fee, coalesce(o.discount, 0) as disc, o.items, o.created_at,
           coalesce(nullif(right(regexp_replace(coalesce(o.customer->>'phone', ''), '\D', '', 'g'), 10), ''), o.customer_uid::text) as who
    from public.orders o
    where o.rest_id = v_rest and o.status = 'entregado' and o.created_at < v_fin
  ),
  primero as (select who, min(created_at) as f from todo group by who),
  mes as (select t.*, (p.f >= v_ini) as nuevo from todo t join primero p using (who) where t.created_at >= v_ini),
  platos as (
    select i->>'name' as name, sum(coalesce((i->>'qty')::int, 1)) as qty
    from mes, jsonb_array_elements(case when jsonb_typeof(mes.items) = 'array' then mes.items else '[]'::jsonb end) i
    group by 1 order by 2 desc, 1 limit 3
  ),
  dias as (
    select extract(day from (created_at at time zone 'America/Bogota'))::int as d, count(*) as n from mes group by 1
  )
  select jsonb_build_object(
    'mes', p_mes,
    'comision_pct', v_pct,
    'pedidos', (select count(*) from mes),
    'ventas', (select coalesce(sum(subtotal), 0) from mes),
    'domicilios', (select coalesce(sum(fee), 0) from mes),
    'premios', (select coalesce(sum(disc), 0) from mes),
    'clientes', (select count(distinct who) from mes),
    'nuevos', (select count(distinct who) from mes where nuevo),
    'pedidos_nuevos', (select count(*) from mes where nuevo),
    'repiten', (select count(*) from (select who from mes group by who having count(*) > 1) x),
    'volvieron', (select count(distinct who) from mes where not nuevo),
    'top', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'qty', qty)) from platos), '[]'::jsonb),
    'dias', coalesce((select jsonb_object_agg(d, n) from dias), '{}'::jsonb),
    'antes', (select jsonb_build_object('pedidos', count(*), 'ventas', coalesce(sum(subtotal), 0)) from todo where created_at >= v_pini and created_at < v_ini)
  ) into res;
  return res;
end $$;

revoke all on function public.rest_resumen_mes(text) from public, anon;
grant execute on function public.rest_resumen_mes(text) to authenticated;
