-- Pido y Ido 014: saber de verdad cuándo llegó el pedido.
-- * El cliente puede tocar "Ya lo recibí" en su app.
-- * El domiciliario tiene su propio enlace (con clave) con "Ya lo recogí" y "Entregado" (con el código del cliente).
-- * Se guarda quién confirmó la entrega (cliente / domiciliario / negocio) y a qué hora se recogió.
-- La comisión del 5% cuenta solo pedidos con status 'entregado'.
-- Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

-- Por si todavía no se pegó 013-rechten.sql (permisos de tabla). No cambia las reglas por fila.
grant select, insert, delete on public.restaurants to anon, authenticated;
grant select on public.orders to anon, authenticated;
grant select on public.order_pins to anon, authenticated;
grant select, insert, update, delete on public.riders to anon, authenticated;
grant select, insert, update, delete on public.rest_riders to anon, authenticated;
grant select, insert, update, delete on public.promoters to anon, authenticated;

alter table public.orders
  add column if not exists rider_key text not null default substr(md5(random()::text || clock_timestamp()::text), 1, 12),
  add column if not exists picked_at timestamptz,
  add column if not exists delivered_by text;
do $$ begin
  alter table public.orders add constraint orders_delivered_by_chk check (delivered_by in ('cliente', 'domiciliario', 'negocio'));
exception when duplicate_object then null; end $$;

-- Confirmar con el código de 4 números (máx. 5 intentos). Ahora guarda quién lo confirmó.
create or replace function public.deliver_order(p_id bigint, p_pin text) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders; s public.order_pins;
begin
  if auth.uid() is null then return 'no_session'; end if;
  select * into o from public.orders where id = p_id for update;
  if not found then return 'no_existe'; end if;
  if o.status = 'entregado' then return 'ya_entregado'; end if;
  if o.status not in ('listo', 'en_camino') then return 'cerrado'; end if;
  select * into s from public.order_pins where order_id = p_id for update;
  if s.attempts >= 5 then return 'bloqueado'; end if;
  if s.pin <> trim(coalesce(p_pin, '')) then
    update public.order_pins set attempts = attempts + 1 where order_id = p_id;
    return 'incorrecto';
  end if;
  update public.orders set status = 'entregado', delivered_at = now(),
    delivered_by = case when o.rest_id in (select public.my_rest_ids()) then 'negocio' else 'domiciliario' end
  where id = p_id;
  return 'ok';
end $$;

-- El cliente confirma que ya tiene su pedido.
create or replace function public.confirm_received(p_id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare v_st text;
begin
  select status into v_st from public.orders where id = p_id and customer_uid = auth.uid() for update;
  if not found then return 'no_existe'; end if;
  if v_st = 'entregado' then return 'ya_entregado'; end if;
  if v_st not in ('listo', 'en_camino') then return 'cerrado'; end if;
  update public.orders set status = 'entregado', delivered_at = now(), delivered_by = 'cliente' where id = p_id;
  return 'ok';
end $$;

-- Lo mínimo que ve el domiciliario en su enlace. Sin la clave del enlace no ve nada.
drop function if exists public.order_for_rider(bigint);
create or replace function public.order_for_rider(p_id bigint, p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', o.id, 'status', o.status, 'rest', r.name, 'address', o.customer->>'address',
    'name', split_part(o.customer->>'name', ' ', 1), 'total', o.total, 'pay', o.pay,
    'picked_at', o.picked_at, 'delivered_at', o.delivered_at, 'delivered_by', o.delivered_by)
  from public.orders o join public.restaurants r on r.id = o.rest_id
  where o.id = p_id and o.rider_key = p_key
$$;

-- El domiciliario avisa que ya recogió el pedido en el local.
create or replace function public.rider_picked(p_id bigint, p_key text) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_id and rider_key = p_key for update;
  if not found then return 'no_existe'; end if;
  if o.status not in ('listo', 'en_camino') then return 'cerrado'; end if;
  update public.orders set picked_at = coalesce(picked_at, now()), status = 'en_camino', sent_at = coalesce(sent_at, now()) where id = p_id;
  return 'ok';
end $$;

revoke execute on function public.confirm_received(bigint) from public, anon;
revoke execute on function public.order_for_rider(bigint, text) from public, anon;
revoke execute on function public.rider_picked(bigint, text) from public, anon;
grant execute on function public.deliver_order(bigint, text) to authenticated;
grant execute on function public.confirm_received(bigint) to authenticated;
grant execute on function public.order_for_rider(bigint, text) to authenticated;
grant execute on function public.rider_picked(bigint, text) to authenticated;
