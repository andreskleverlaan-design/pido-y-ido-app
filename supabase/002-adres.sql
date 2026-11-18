-- Pido y Ido: zona de entrega (pin en el mapa + distancia máxima por restaurante)
-- Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez.

alter table public.restaurants
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists radius_km numeric not null default 3;
grant update (lat, lng, radius_km) on public.restaurants to authenticated;

create or replace function public.km_between(a_lat float8, a_lng float8, b_lat float8, b_lng float8) returns float8
language sql immutable set search_path = public as $$
  select 6371 * 2 * asin(sqrt(power(sin(radians(b_lat - a_lat) / 2), 2) + cos(radians(a_lat)) * cos(radians(b_lat)) * power(sin(radians(b_lng - a_lng) / 2), 2)))
$$;

-- Hacer un pedido: el servidor calcula precios con el menú real, revisa la zona de entrega y crea el PIN.
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.restaurants;
  it jsonb; d jsonb;
  lines jsonb := '[]'::jsonb;
  sub integer := 0; v_fee integer; v_total integer; q integer;
  v_mode text := coalesce(p->>'mode', 'dom');
  v_pay text := coalesce(p->>'pay', 'ef');
  v_cash integer;
  v_id bigint; v_pin text;
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
  v_fee := case when v_mode = 'dom' then r.fee else 0 end;
  v_total := sub + v_fee;
  v_cash := case when v_pay = 'ef' then greatest(coalesce((p->>'cash_given')::integer, v_total), v_total) else 0 end;
  insert into public.orders (rest_id, customer_uid, customer, items, subtotal, fee, total, mode, note, pay, cash_given, geo, ref_slug)
  values (r.id, auth.uid(),
    jsonb_build_object('name', left(coalesce(p->'customer'->>'name', ''), 80), 'phone', left(coalesce(p->'customer'->>'phone', ''), 15), 'address', left(coalesce(p->'customer'->>'address', ''), 300)),
    lines, sub, v_fee, v_total, v_mode, left(coalesce(p->>'note', ''), 300), v_pay, v_cash,
    case when jsonb_typeof(p->'geo') = 'object' then p->'geo' else null end,
    nullif(left(coalesce(p->>'ref_slug', ''), 40), ''))
  returning id into v_id;
  v_pin := lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
  insert into public.order_pins (order_id, pin) values (v_id, v_pin);
  return jsonb_build_object('id', v_id, 'pin', v_pin);
end $$;
revoke execute on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
