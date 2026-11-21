-- Pido y Ido 015: ningún pedido se queda colgado.
-- * El negocio avisa al domiciliario mientras cocina, con la hora para recoger (ready_at).
-- * Nequi / Daviplata: el negocio marca "Pago recibido" o "No ha llegado" (pay_ok).
-- * El negocio puede cerrar un pedido que no se entregó, con el motivo (status 'no_entregado').
-- * Sin respuesta en 15 minutos (o 20 min antes de la hora programada): se cierra solo (status 'sin_respuesta').
-- * Abierto 3 horas después de aceptado (o de la hora programada): cuenta como entregado (delivered_by 'auto').
--   Si el negocio marcó que el pago no llegó, se cierra como 'no_entregado'.
-- * El negocio ve si un cliente nuevo ya tuvo pedidos sin pagar o sin recibir.
-- La comisión del 5% sigue contando solo pedidos con status 'entregado'.
-- Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

-- ---------- Columnas y estados nuevos ----------
alter table public.orders
  add column if not exists ready_at timestamptz,
  add column if not exists pay_ok boolean,
  add column if not exists pay_ok_at timestamptz,
  add column if not exists closed_at timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in
  ('recibido', 'preparando', 'listo', 'en_camino', 'entregado', 'rechazado', 'cancelado', 'no_entregado', 'sin_respuesta'));
alter table public.orders drop constraint if exists orders_delivered_by_chk;
alter table public.orders add constraint orders_delivered_by_chk check (delivered_by in ('cliente', 'domiciliario', 'negocio', 'auto'));

create index if not exists orders_open_idx on public.orders(status) where status in ('recibido', 'preparando', 'listo', 'en_camino');

-- El negocio puede guardar la hora en que el domiciliario recoge.
grant update (status, eta_min, accepted_at, sent_at, rider_id, rider, reject_reason, ready_at) on public.orders to authenticated;

-- ---------- Nequi / Daviplata: ¿llegó la plata? ----------
create or replace function public.rest_pay_ok(p_id bigint, p_ok boolean) returns text
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set pay_ok = p_ok, pay_ok_at = now()
  where id = p_id and rest_id in (select public.my_rest_ids()) and pay <> 'ef' and p_ok is not null
    and status in ('preparando', 'listo', 'en_camino', 'entregado');
  return case when found then 'ok' else 'no' end;
end $$;

-- ---------- Cerrar un pedido que no se entregó ----------
create or replace function public.rest_not_delivered(p_id bigint, p_reason text) returns text
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = 'no_entregado', closed_at = now(),
    reject_reason = left(coalesce(nullif(btrim(p_reason), ''), 'No se entregó.'), 200)
  where id = p_id and rest_id in (select public.my_rest_ids()) and status in ('preparando', 'listo', 'en_camino');
  return case when found then 'ok' else 'no' end;
end $$;

-- ---------- Cerrar lo que quedó colgado ----------
-- Lo llama la app (como mucho una vez por minuto) y, si se puede, pg_cron cada 5 minutos.
create or replace function public.close_stale() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0; k integer;
begin
  update public.orders set status = 'sin_respuesta', closed_at = now(),
    reject_reason = 'No respondieron a tiempo.'
  where status = 'recibido' and (
    (scheduled_for is null and created_at < now() - interval '15 minutes')
    or (scheduled_for is not null and now() > scheduled_for - interval '20 minutes'));
  get diagnostics k = row_count; n := n + k;

  update public.orders set status = 'no_entregado', closed_at = now(), reject_reason = 'El pago no llegó.'
  where status in ('preparando', 'listo', 'en_camino') and pay_ok = false
    and coalesce(scheduled_for, accepted_at, created_at) < now() - interval '3 hours';
  get diagnostics k = row_count; n := n + k;

  update public.orders set status = 'entregado', delivered_at = now(), delivered_by = 'auto', closed_at = now()
  where status in ('preparando', 'listo', 'en_camino')
    and coalesce(scheduled_for, accepted_at, created_at) < now() - interval '3 hours';
  get diagnostics k = row_count; n := n + k;
  return n;
end $$;

-- ---------- El rider puede recoger mientras el pedido sigue en "Preparando" ----------
create or replace function public.order_for_rider(p_id bigint, p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', o.id, 'status', o.status, 'rest', r.name, 'address', o.customer->>'address',
    'name', split_part(o.customer->>'name', ' ', 1), 'total', o.total, 'pay', o.pay, 'pay_ok', o.pay_ok,
    'ready_at', o.ready_at, 'picked_at', o.picked_at, 'delivered_at', o.delivered_at, 'delivered_by', o.delivered_by)
  from public.orders o join public.restaurants r on r.id = o.rest_id
  where o.id = p_id and o.rider_key = p_key
$$;

create or replace function public.rider_picked(p_id bigint, p_key text) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_id and rider_key = p_key for update;
  if not found then return 'no_existe'; end if;
  if o.status not in ('preparando', 'listo', 'en_camino') then return 'cerrado'; end if;
  update public.orders set picked_at = coalesce(picked_at, now()), status = 'en_camino', sent_at = coalesce(sent_at, now()) where id = p_id;
  return 'ok';
end $$;

-- ---------- ¿Este cliente ya dejó pedidos sin pagar o sin recibir? ----------
-- Solo para los pedidos del propio negocio. Cuenta en todos los negocios, pero no dice cuáles.
create or replace function public.order_flags(p_ids bigint[]) returns table (order_id bigint, fallos integer)
language sql stable security definer set search_path = public as $$
  select o.id, (
    select count(*)::integer from public.orders x
    where x.id <> o.id and x.status = 'no_entregado'
      and coalesce(x.reject_reason, '') not like 'Tuvimos que cancelarlo%'
      and (x.customer_uid = o.customer_uid
        or (length(regexp_replace(coalesce(o.customer->>'phone', ''), '\D', '', 'g')) >= 7
          and right(regexp_replace(coalesce(x.customer->>'phone', ''), '\D', '', 'g'), 10) = right(regexp_replace(coalesce(o.customer->>'phone', ''), '\D', '', 'g'), 10))))
  from public.orders o
  where o.id = any(p_ids) and o.rest_id in (select public.my_rest_ids())
$$;

-- ---------- Premio: un premio usado en un pedido que no llegó vuelve a estar libre ----------
create or replace function public.reward_state(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with x as (
    select
      count(*) filter (where status = 'entregado' and discount = 0) as normal,
      count(*) filter (where discount > 0 and status not in ('rechazado', 'cancelado', 'no_entregado', 'sin_respuesta')) as used
    from public.orders where customer_uid = p_uid
  )
  select jsonb_build_object(
    'every', 5, 'amount', 2000, 'min', 10000,
    'stamps', greatest(normal - used * 4, 0),
    'ready', normal - used * 4 >= 4)
  from x
$$;

revoke execute on function public.rest_pay_ok(bigint, boolean) from public, anon;
revoke execute on function public.rest_not_delivered(bigint, text) from public, anon;
revoke execute on function public.close_stale() from public, anon;
revoke execute on function public.order_flags(bigint[]) from public, anon;
revoke execute on function public.order_for_rider(bigint, text) from public, anon;
revoke execute on function public.rider_picked(bigint, text) from public, anon;
revoke execute on function public.reward_state(uuid) from public, anon, authenticated;
grant execute on function public.rest_pay_ok(bigint, boolean) to authenticated;
grant execute on function public.rest_not_delivered(bigint, text) to authenticated;
grant execute on function public.close_stale() to authenticated;
grant execute on function public.order_flags(bigint[]) to authenticated;
grant execute on function public.order_for_rider(bigint, text) to authenticated;
grant execute on function public.rider_picked(bigint, text) to authenticated;

-- ---------- Cada 5 minutos, aunque nadie tenga la app abierta (si Supabase deja usar pg_cron) ----------
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'pyi-cierre';
  perform cron.schedule('pyi-cierre', '*/5 * * * *', 'select public.close_stale()');
exception when others then
  raise notice 'pg_cron no disponible: la app cierra los pedidos colgados cuando alguien la abre.';
end $$;

select public.close_stale() as pedidos_cerrados_ahora;
