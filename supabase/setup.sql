-- Pido y Ido: base de datos en línea (Supabase)
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run".
-- Se puede ejecutar otra vez sin problema (no borra datos).

-- ---------- Tablas ----------
create table if not exists public.restaurants (
  id text primary key,
  owner uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  short text not null default '',
  sub text not null default '',
  img text not null default '',
  cats text[] not null default '{}',
  eta text not null default '30–40 min',
  pickup text not null default '15 min',
  min integer not null default 0,
  fee integer not null default 0,
  address text not null default '',
  phone text not null default '',
  nequi text not null default '',
  dishes jsonb not null default '[]'::jsonb,
  open boolean not null default false,
  rating_sum numeric not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists restaurants_owner_idx on public.restaurants(owner);

create table if not exists public.orders (
  id bigint generated always as identity (start with 1001) primary key,
  rest_id text not null references public.restaurants(id) on delete cascade,
  customer_uid uuid not null default auth.uid(),
  customer jsonb not null,
  items jsonb not null,
  subtotal integer not null,
  fee integer not null default 0,
  total integer not null,
  mode text not null check (mode in ('dom', 'rec')),
  note text not null default '',
  pay text not null check (pay in ('ef', 'nequi', 'davi')),
  cash_given integer not null default 0,
  status text not null default 'recibido' check (status in ('recibido', 'preparando', 'listo', 'en_camino', 'entregado', 'rechazado', 'cancelado')),
  eta_min integer,
  reject_reason text,
  rider_id text,
  rider jsonb,
  geo jsonb,
  ref_slug text,
  rating integer,
  tags text[],
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz
);
create index if not exists orders_rest_idx on public.orders(rest_id, created_at desc);
create index if not exists orders_customer_idx on public.orders(customer_uid, created_at desc);
create index if not exists orders_ref_idx on public.orders(ref_slug);

-- El código de entrega (PIN) solo lo ve el cliente, nunca el restaurante.
create table if not exists public.order_pins (
  order_id bigint primary key references public.orders(id) on delete cascade,
  pin text not null,
  attempts integer not null default 0
);

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid(),
  name text not null,
  phone text not null,
  vehicle text not null default 'Moto',
  barrio text not null default '',
  hours text[] not null default '{}',
  docs text[] not null default '{}',
  board boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists riders_owner_idx on public.riders(owner);

-- La lista propia de domiciliarios de cada restaurante.
create table if not exists public.rest_riders (
  rest_id text not null references public.restaurants(id) on delete cascade,
  rider_id uuid not null references public.riders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rest_id, rider_id)
);

create table if not exists public.promoters (
  slug text primary key,
  owner uuid not null unique default auth.uid(),
  created_at timestamptz not null default now()
);

-- ---------- Ayudas ----------
create or replace function public.my_rest_ids() returns setof text
language sql stable security definer set search_path = public as $$
  select id from public.restaurants where owner = auth.uid()
$$;

create or replace function public.is_full_user() returns boolean
language sql stable set search_path = public as $$
  select auth.uid() is not null and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;

-- ---------- Seguridad (quién puede ver y cambiar qué) ----------
alter table public.restaurants enable row level security;
alter table public.orders enable row level security;
alter table public.order_pins enable row level security;
alter table public.riders enable row level security;
alter table public.rest_riders enable row level security;
alter table public.promoters enable row level security;

drop policy if exists "restaurants: todos ven" on public.restaurants;
create policy "restaurants: todos ven" on public.restaurants for select using (true);
drop policy if exists "restaurants: dueño crea" on public.restaurants;
create policy "restaurants: dueño crea" on public.restaurants for insert to authenticated
  with check (owner = auth.uid() and public.is_full_user() and rating_sum = 0 and rating_count = 0);
drop policy if exists "restaurants: dueño cambia" on public.restaurants;
create policy "restaurants: dueño cambia" on public.restaurants for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

revoke update on public.restaurants from anon, authenticated;
grant update (name, short, sub, img, cats, eta, pickup, min, fee, address, phone, nequi, dishes, open) on public.restaurants to authenticated;

drop policy if exists "orders: cliente y restaurante ven" on public.orders;
create policy "orders: cliente y restaurante ven" on public.orders for select to authenticated
  using (customer_uid = auth.uid() or rest_id in (select public.my_rest_ids()));
drop policy if exists "orders: restaurante cambia" on public.orders;
create policy "orders: restaurante cambia" on public.orders for update to authenticated
  using (rest_id in (select public.my_rest_ids()))
  with check (rest_id in (select public.my_rest_ids()) and status in ('preparando', 'listo', 'en_camino', 'rechazado'));
-- pedidos nuevos solo por place_order()
revoke insert, update, delete on public.orders from anon, authenticated;
grant update (status, eta_min, accepted_at, sent_at, rider_id, rider, reject_reason) on public.orders to authenticated;

drop policy if exists "pins: solo el cliente" on public.order_pins;
create policy "pins: solo el cliente" on public.order_pins for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_uid = auth.uid()));
revoke insert, update, delete on public.order_pins from anon, authenticated;

drop policy if exists "riders: ver" on public.riders;
create policy "riders: ver" on public.riders for select
  using (board or owner = auth.uid()
    or exists (select 1 from public.rest_riders rr where rr.rider_id = riders.id and rr.rest_id in (select public.my_rest_ids())));
drop policy if exists "riders: crear" on public.riders;
create policy "riders: crear" on public.riders for insert to authenticated with check (owner = auth.uid());
drop policy if exists "riders: cambiar" on public.riders;
create policy "riders: cambiar" on public.riders for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "riders: borrar" on public.riders;
create policy "riders: borrar" on public.riders for delete to authenticated using (owner = auth.uid());

drop policy if exists "rest_riders: dueño" on public.rest_riders;
create policy "rest_riders: dueño" on public.rest_riders for all to authenticated
  using (rest_id in (select public.my_rest_ids())) with check (rest_id in (select public.my_rest_ids()));

drop policy if exists "promoters: propio" on public.promoters;
create policy "promoters: propio" on public.promoters for select to authenticated using (owner = auth.uid());
drop policy if exists "promoters: crear" on public.promoters;
create policy "promoters: crear" on public.promoters for insert to authenticated with check (owner = auth.uid());

-- ---------- Acciones ----------
-- Hacer un pedido: el servidor calcula precios con el menú real y crea el PIN.
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

-- Cancelar: solo el cliente, y solo antes de que el restaurante acepte.
create or replace function public.cancel_order(p_id bigint) returns text
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = 'cancelado'
  where id = p_id and customer_uid = auth.uid() and status = 'recibido';
  return case when found then 'ok' else 'no' end;
end $$;

-- Confirmar entrega con el código de 4 números (máx. 5 intentos).
-- La puede usar el restaurante o el domiciliario desde el enlace del WhatsApp.
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
  update public.orders set status = 'entregado', delivered_at = now() where id = p_id;
  return 'ok';
end $$;

-- Lo mínimo que ve el domiciliario en el enlace de entrega.
create or replace function public.order_for_rider(p_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', o.id, 'status', o.status, 'rest', r.name, 'address', o.customer->>'address', 'name', split_part(o.customer->>'name', ' ', 1))
  from public.orders o join public.restaurants r on r.id = o.rest_id where o.id = p_id
$$;

-- Calificar: solo el cliente, una vez, después de la entrega.
create or replace function public.rate_order(p_id bigint, p_stars integer, p_tags text[]) returns text
language plpgsql security definer set search_path = public as $$
declare v_rest text;
begin
  if p_stars < 1 or p_stars > 5 then return 'no'; end if;
  update public.orders set rating = p_stars, tags = p_tags
  where id = p_id and customer_uid = auth.uid() and status = 'entregado' and rating is null
  returning rest_id into v_rest;
  if v_rest is null then return 'no'; end if;
  update public.restaurants set rating_sum = rating_sum + p_stars, rating_count = rating_count + 1 where id = v_rest;
  return 'ok';
end $$;

-- Pedidos que llegaron con el enlace del promotor (sin datos personales).
create or replace function public.promo_orders() returns table (id bigint, rest_id text, subtotal integer, status text, created_at timestamptz, cust text)
language sql stable security definer set search_path = public as $$
  select o.id, o.rest_id, o.subtotal, o.status, o.created_at, md5(o.customer->>'phone')
  from public.orders o join public.promoters p on p.slug = o.ref_slug
  where p.owner = auth.uid()
  order by o.created_at desc limit 200
$$;

revoke execute on function public.my_rest_ids() from public, anon;
grant execute on function public.my_rest_ids() to authenticated;
revoke execute on function public.place_order(jsonb) from public, anon;
revoke execute on function public.cancel_order(bigint) from public, anon;
revoke execute on function public.deliver_order(bigint, text) from public, anon;
revoke execute on function public.order_for_rider(bigint) from public, anon;
revoke execute on function public.rate_order(bigint, integer, text[]) from public, anon;
revoke execute on function public.promo_orders() from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
grant execute on function public.cancel_order(bigint) to authenticated;
grant execute on function public.deliver_order(bigint, text) to authenticated;
grant execute on function public.order_for_rider(bigint) to authenticated;
grant execute on function public.rate_order(bigint, integer, text[]) to authenticated;
grant execute on function public.promo_orders() to authenticated;

-- ---------- Avisos en vivo ----------
do $$ begin
  begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.restaurants; exception when duplicate_object then null; end;
end $$;
