-- Pido y Ido 009: programar un pedido para más tarde.
--   1) Cada negocio tiene un horario (abre / cierra, hora de Colombia). Si no lo pone: restaurante 11:00-21:00, tienda 08:00-20:00.
--   2) El cliente elige "Lo antes posible" o "Para más tarde" (hoy o mañana, dentro del horario).
--      Programar también funciona cuando el negocio está cerrado ahora (por ejemplo: de noche pide el almuerzo de mañana).
--   3) El negocio ve la hora programada en el pedido.
-- Necesita antes: setup.sql, 004-tiendas.sql y 006-clientes-fieles.sql.
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

alter table public.restaurants
  add column if not exists abre text check (abre ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column if not exists cierra text check (cierra ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
grant update (abre, cierra) on public.restaurants to authenticated;

alter table public.orders add column if not exists scheduled_for timestamptz;

create or replace function public.rest_abre(r public.restaurants) returns text
language sql stable as $$ select coalesce(r.abre, case when r.kind = 'restaurante' then '11:00' else '08:00' end) $$;
create or replace function public.rest_cierra(r public.restaurants) returns text
language sql stable as $$ select coalesce(r.cierra, case when r.kind = 'restaurante' then '21:00' else '20:00' end) $$;

-- ---------- Hacer un pedido (ahora también programado) ----------
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
  v_when timestamptz; v_t time;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  select * into r from public.restaurants where id = p->>'rest_id';
  if not found then raise exception 'no_restaurant'; end if;
  -- Pedido programado: entre 40 minutos y 2 días desde ahora, dentro del horario del negocio (hora de Colombia).
  v_when := nullif(p->>'scheduled_for', '')::timestamptz;
  if v_when is not null then
    if v_when < now() + interval '40 minutes' then raise exception 'too_soon'; end if;
    if v_when > now() + interval '2 days' then raise exception 'too_late'; end if;
    v_t := (v_when at time zone 'America/Bogota')::time;
    if v_t < public.rest_abre(r)::time or v_t > public.rest_cierra(r)::time then raise exception 'out_of_hours'; end if;
  elsif not r.open then
    raise exception 'closed';
  end if;
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
  insert into public.orders (rest_id, customer_uid, customer, items, subtotal, fee, total, discount, mode, note, pay, cash_given, geo, ref_slug, wish, wish_img, scheduled_for)
  values (r.id, auth.uid(),
    jsonb_build_object('name', left(coalesce(p->'customer'->>'name', ''), 80), 'phone', left(coalesce(p->'customer'->>'phone', ''), 15),
      'address', left(coalesce(p->'customer'->>'address', ''), 300), 'wa', coalesce((p->'customer'->>'wa')::boolean, false)),
    lines, sub, v_fee, v_total, v_disc, v_mode, left(coalesce(p->>'note', ''), 300), v_pay, v_cash,
    case when jsonb_typeof(p->'geo') = 'object' then p->'geo' else null end,
    nullif(left(coalesce(p->>'ref_slug', ''), 40), ''), v_wish, v_img, v_when)
  returning id into v_id;
  v_pin := lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
  insert into public.order_pins (order_id, pin) values (v_id, v_pin);
  return jsonb_build_object('id', v_id, 'pin', v_pin, 'discount', v_disc, 'total', v_total);
end $$;

revoke execute on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
