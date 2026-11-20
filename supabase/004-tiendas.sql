-- Pido y Ido 004: también tiendas (droguería, minimercado, licorera, floristería, ferretería, otro).
-- Las tiendas no necesitan menú: el cliente escribe su lista o manda una foto,
-- y la tienda confirma el precio al aceptar el pedido.
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

-- ---------- Tipo de negocio ----------
alter table public.restaurants add column if not exists kind text not null default 'restaurante';
do $$ begin
  alter table public.restaurants add constraint restaurants_kind_chk
    check (kind in ('restaurante', 'drogueria', 'minimercado', 'licorera', 'floristeria', 'ferreteria', 'otro'));
exception when duplicate_object then null; end $$;
grant update (kind) on public.restaurants to authenticated;

-- ---------- Pedido libre (lista escrita o foto) ----------
alter table public.orders
  add column if not exists wish text,
  add column if not exists wish_img text;

-- Fotos de listas y fórmulas: privadas. Las ve solo el cliente que la subió y la tienda del pedido.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listas', 'listas', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "listas_insert_own_folder" on storage.objects;
create policy "listas_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listas' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "listas_ver" on storage.objects;
create policy "listas_ver" on storage.objects for select to authenticated
  using (bucket_id = 'listas' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.orders o where o.wish_img = storage.objects.name and o.rest_id in (select public.my_rest_ids()))
  ));

-- ---------- Hacer un pedido (ahora también pedido libre) ----------
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
  v_wish text; v_img text;
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
  if r.kind <> 'restaurante' then
    -- Pedido libre: el precio lo pone la tienda al aceptar.
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
  end if;
  v_fee := case when v_mode = 'dom' then r.fee else 0 end;
  v_total := sub + v_fee;
  v_cash := case when v_pay <> 'ef' then 0
    when v_wish is not null then greatest(coalesce((p->>'cash_given')::integer, 0), 0)
    else greatest(coalesce((p->>'cash_given')::integer, v_total), v_total) end;
  insert into public.orders (rest_id, customer_uid, customer, items, subtotal, fee, total, mode, note, pay, cash_given, geo, ref_slug, wish, wish_img)
  values (r.id, auth.uid(),
    jsonb_build_object('name', left(coalesce(p->'customer'->>'name', ''), 80), 'phone', left(coalesce(p->'customer'->>'phone', ''), 15), 'address', left(coalesce(p->'customer'->>'address', ''), 300)),
    lines, sub, v_fee, v_total, v_mode, left(coalesce(p->>'note', ''), 300), v_pay, v_cash,
    case when jsonb_typeof(p->'geo') = 'object' then p->'geo' else null end,
    nullif(left(coalesce(p->>'ref_slug', ''), 40), ''), v_wish, v_img)
  returning id into v_id;
  v_pin := lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
  insert into public.order_pins (order_id, pin) values (v_id, v_pin);
  return jsonb_build_object('id', v_id, 'pin', v_pin);
end $$;

-- La tienda pone el precio de un pedido libre y lo acepta.
create or replace function public.price_order(p_id bigint, p_amount integer, p_eta integer) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_id and rest_id in (select public.my_rest_ids()) for update;
  if not found then return 'no_existe'; end if;
  if o.wish is null then return 'no_libre'; end if;
  if o.status <> 'recibido' then return 'cerrado'; end if;
  if p_amount is null or p_amount < 500 or p_amount > 10000000 then return 'monto'; end if;
  update public.orders set subtotal = p_amount, total = p_amount + fee, status = 'preparando',
    eta_min = least(greatest(coalesce(p_eta, 30), 5), 240), accepted_at = now(),
    cash_given = case when pay = 'ef' and cash_given < p_amount + fee then p_amount + fee else cash_given end
  where id = p_id;
  return 'ok';
end $$;

-- Cancelar: antes de que acepten, o (pedido libre) si el cliente no está de acuerdo con el precio, antes de que salga.
create or replace function public.cancel_order(p_id bigint) returns text
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = 'cancelado'
  where id = p_id and customer_uid = auth.uid()
    and (status = 'recibido' or (wish is not null and status = 'preparando'));
  return case when found then 'ok' else 'no' end;
end $$;

revoke execute on function public.place_order(jsonb) from public, anon;
revoke execute on function public.price_order(bigint, integer, integer) from public, anon;
revoke execute on function public.cancel_order(bigint) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
grant execute on function public.price_order(bigint, integer, integer) to authenticated;
grant execute on function public.cancel_order(bigint) to authenticated;
