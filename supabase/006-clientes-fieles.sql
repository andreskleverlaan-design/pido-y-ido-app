-- Pido y Ido 006: clientes fieles a la app.
--   1) Premio: cada 5º pedido por la app tiene $2.000 de descuento (lo paga Pido y Ido, se resta de la comisión del negocio).
--   2) El número del negocio ya no es público: solo el dueño lo ve. El cliente ve el Nequi solo cuando tiene un pedido aceptado.
--   3) "Ya pagué" dentro de la app (en vez de mandar el comprobante al WhatsApp del negocio).
--   4) Preparado para avisos por WhatsApp desde el número de Pido y Ido (el cliente da permiso al pedir).
-- Necesita antes: setup.sql y 004-tiendas.sql.
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

-- ---------- Columnas nuevas en pedidos ----------
alter table public.orders
  add column if not exists discount integer not null default 0,
  add column if not exists paid_claim_at timestamptz;

-- ---------- Contacto privado del negocio ----------
create table if not exists public.rest_contact (
  rest_id text primary key references public.restaurants(id) on delete cascade deferrable initially deferred,
  phone text not null default '',
  nequi text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.rest_contact enable row level security;
drop policy if exists "rest_contact: solo el dueño" on public.rest_contact;
create policy "rest_contact: solo el dueño" on public.rest_contact for select to authenticated
  using (rest_id in (select public.my_rest_ids()));
revoke all on public.rest_contact from anon, authenticated;
grant select on public.rest_contact to authenticated;

-- Cuando el negocio guarda su WhatsApp o Nequi, se mueve a la tabla privada y en la tabla pública queda vacío.
create or replace function public.restaurants_hide_contact() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.phone, '') <> '' or coalesce(new.nequi, '') <> '' then
    insert into public.rest_contact (rest_id, phone, nequi)
    values (new.id, regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), btrim(coalesce(new.nequi, '')))
    on conflict (rest_id) do update set
      phone = coalesce(nullif(excluded.phone, ''), public.rest_contact.phone),
      nequi = coalesce(nullif(excluded.nequi, ''), public.rest_contact.nequi),
      updated_at = now();
    new.phone := '';
    new.nequi := '';
  end if;
  return new;
end $$;
drop trigger if exists restaurants_hide_contact on public.restaurants;
create trigger restaurants_hide_contact before insert or update on public.restaurants
  for each row execute function public.restaurants_hide_contact();

-- Mover los números que ya estaban (el trigger hace el trabajo).
update public.restaurants set phone = phone where phone <> '' or nequi <> '';

-- ---------- Premio: cada 5º pedido ----------
-- 4 pedidos entregados sin descuento = 1 premio. Un premio usado en un pedido rechazado o cancelado vuelve a estar libre.
create or replace function public.reward_state(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with x as (
    select
      count(*) filter (where status = 'entregado' and discount = 0) as normal,
      count(*) filter (where discount > 0 and status not in ('rechazado', 'cancelado')) as used
    from public.orders where customer_uid = p_uid
  )
  select jsonb_build_object(
    'every', 5, 'amount', 2000, 'min', 10000,
    'stamps', greatest(normal - used * 4, 0),
    'ready', normal - used * 4 >= 4)
  from x
$$;
create or replace function public.my_reward() returns jsonb
language sql stable security definer set search_path = public as $$
  select public.reward_state(auth.uid())
$$;

-- ---------- Hacer un pedido (con premio y permiso para avisos) ----------
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.restaurants;
  it jsonb; d jsonb;
  lines jsonb := '[]'::jsonb;
  sub integer := 0; v_fee integer; v_total integer; q integer; v_disc integer := 0;
  v_mode text := coalesce(p->>'mode', 'dom');
  v_pay text := coalesce(p->>'pay', 'ef');
  v_cash integer;
  v_wish text; v_img text;
  v_id bigint; v_pin text; v_rw jsonb;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  select * into r from public.restaurants where id = p->>'rest_id';
  if not found then raise exception 'no_restaurant'; end if;
  if not r.open then raise exception 'closed'; end if;
  if v_mode = 'dom' then
    if coalesce(jsonb_typeof(p->'geo'), '') <> 'object' or (p->'geo'->>'lat') is null or (p->'geo'->>'lng') is null then raise exception 'no_geo'; end if;
    if r.lat is not null and r.lng is not null
      and public.km_between(r.lat, r.lng, (p->'geo'->>'lat')::float8, (p->'geo'->>'lng')::float8) > r.radius_km then
      raise exception 'too_far';
    end if;
  end if;
  if r.kind <> 'restaurante' then
    v_wish := left(btrim(coalesce(p->>'wish', '')), 1000);
    v_img := nullif(left(coalesce(p->>'wish_img', ''), 200), '');
    if v_img is not null and split_part(v_img, '/', 1) <> auth.uid()::text then v_img := null; end if;
    if length(v_wish) < 2 and v_img is null then raise exception 'empty'; end if;
    if v_wish = '' then v_wish := '(Ver la foto)'; end if;
  else
    for it in select * from jsonb_array_elements(coalesce(p->'items', '[]'::jsonb)) loop
      q := least(greatest(coalesce((it->>'qty')::integer, 0), 0), 50);
      if q = 0 then continue; end if;
      select x into d from jsonb_array_elements(r.dishes) x where x->>'id' = it->>'id' limit 1;
      if d is null then raise exception 'dish_gone'; end if;
      lines := lines || jsonb_build_array(jsonb_build_object('id', d->>'id', 'name', d->>'name', 'price', (d->>'price')::integer, 'qty', q));
      sub := sub + (d->>'price')::integer * q;
    end loop;
    if jsonb_array_length(lines) = 0 then raise exception 'empty'; end if;
    if sub < r.min then raise exception 'below_min'; end if;
    -- Premio (solo pedidos con menú, porque en una tienda el precio aún no se sabe).
    v_rw := public.reward_state(auth.uid());
    if (v_rw->>'ready')::boolean and sub >= (v_rw->>'min')::integer then v_disc := (v_rw->>'amount')::integer; end if;
  end if;
  v_fee := case when v_mode = 'dom' then r.fee else 0 end;
  v_total := sub + v_fee - v_disc;
  v_cash := case when v_pay <> 'ef' then 0
    when v_wish is not null then greatest(coalesce((p->>'cash_given')::integer, 0), 0)
    else greatest(coalesce((p->>'cash_given')::integer, v_total), v_total) end;
  insert into public.orders (rest_id, customer_uid, customer, items, subtotal, fee, total, discount, mode, note, pay, cash_given, geo, ref_slug, wish, wish_img)
  values (r.id, auth.uid(),
    jsonb_build_object('name', left(coalesce(p->'customer'->>'name', ''), 80), 'phone', left(coalesce(p->'customer'->>'phone', ''), 15),
      'address', left(coalesce(p->'customer'->>'address', ''), 300), 'wa', coalesce((p->'customer'->>'wa')::boolean, false)),
    lines, sub, v_fee, v_total, v_disc, v_mode, left(coalesce(p->>'note', ''), 300), v_pay, v_cash,
    case when jsonb_typeof(p->'geo') = 'object' then p->'geo' else null end,
    nullif(left(coalesce(p->>'ref_slug', ''), 40), ''), v_wish, v_img)
  returning id into v_id;
  v_pin := lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
  insert into public.order_pins (order_id, pin) values (v_id, v_pin);
  return jsonb_build_object('id', v_id, 'pin', v_pin, 'discount', v_disc, 'total', v_total);
end $$;

-- La tienda pone el precio (igual que antes, el total respeta un descuento si lo hubiera).
create or replace function public.price_order(p_id bigint, p_amount integer, p_eta integer) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_id and rest_id in (select public.my_rest_ids()) for update;
  if not found then return 'no_existe'; end if;
  if o.wish is null then return 'no_libre'; end if;
  if o.status <> 'recibido' then return 'cerrado'; end if;
  if p_amount is null or p_amount < 500 or p_amount > 10000000 then return 'monto'; end if;
  update public.orders set subtotal = p_amount, total = p_amount + fee - discount, status = 'preparando',
    eta_min = least(greatest(coalesce(p_eta, 30), 5), 240), accepted_at = now(),
    cash_given = case when pay = 'ef' and cash_given < p_amount + fee - discount then p_amount + fee - discount else cash_given end
  where id = p_id;
  return 'ok';
end $$;

-- ---------- Datos de pago y contacto, solo para el cliente de un pedido aceptado ----------
create or replace function public.order_contact(p_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nequi', case when o.pay <> 'ef' then coalesce(nullif(c.nequi, ''), c.phone) end,
    'phone', case when o.status = 'en_camino' and o.rider_id = 'yo' then c.phone end)
  from public.orders o left join public.rest_contact c on c.rest_id = o.rest_id
  where o.id = p_id and o.customer_uid = auth.uid() and o.status in ('preparando', 'listo', 'en_camino')
$$;

-- El cliente avisa en la app que ya transfirió (Nequi / Daviplata).
create or replace function public.mark_paid(p_id bigint) returns text
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set paid_claim_at = now()
  where id = p_id and customer_uid = auth.uid() and pay <> 'ef' and paid_claim_at is null
    and status in ('preparando', 'listo', 'en_camino');
  return case when found then 'ok' else 'no' end;
end $$;

revoke execute on function public.reward_state(uuid) from public, anon, authenticated;
revoke execute on function public.my_reward() from public, anon;
revoke execute on function public.place_order(jsonb) from public, anon;
revoke execute on function public.price_order(bigint, integer, integer) from public, anon;
revoke execute on function public.order_contact(bigint) from public, anon;
revoke execute on function public.mark_paid(bigint) from public, anon;
grant execute on function public.my_reward() to authenticated;
grant execute on function public.place_order(jsonb) to authenticated;
grant execute on function public.price_order(bigint, integer, integer) to authenticated;
grant execute on function public.order_contact(bigint) to authenticated;
grant execute on function public.mark_paid(bigint) to authenticated;
