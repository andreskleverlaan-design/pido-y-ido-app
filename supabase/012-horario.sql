-- Pido y Ido 012: horario por día de la semana.
--   1) Cada negocio pone en su panel a qué hora abre y cierra cada día (o "cerrado" ese día). Hora de Colombia.
--   2) Fuera de ese horario el negocio sale "Cerrado" y no recibe pedidos "lo antes posible".
--      Los pedidos "para más tarde" solo se pueden programar dentro del horario de ese día.
--   3) El botón Abierto / Cerrado del panel sigue funcionando como pausa (por ejemplo: hoy no abro, o mucho trabajo).
--   Un negocio que todavía no puso su horario funciona igual que antes (solo el botón, y para programar 11-21 o 8-20).
-- Necesita antes: 009-programar.sql.
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

-- horario = lista de 7 días, empezando por el domingo: [domingo, lunes, martes, miércoles, jueves, viernes, sábado].
-- Cada día es ["11:00","21:00"] (abre, cierra) o null (cerrado todo el día).
alter table public.restaurants add column if not exists horario jsonb;

create or replace function public.horario_ok(h jsonb) returns boolean
language sql immutable as $$
  select h is null or (
    jsonb_typeof(h) = 'array' and jsonb_array_length(h) = 7
    and not exists (
      select 1 from jsonb_array_elements(h) d
      where not (
        jsonb_typeof(d) = 'null'
        or (jsonb_typeof(d) = 'array' and jsonb_array_length(d) = 2
            and coalesce(d->>0, '') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            and coalesce(d->>1, '') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            and (d->>0) < (d->>1))
      )
    )
  )
$$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'restaurants_horario_ok') then
    alter table public.restaurants add constraint restaurants_horario_ok check (public.horario_ok(horario));
  end if;
end $$;

grant update (horario) on public.restaurants to authenticated;

-- Horas de un día (0 = domingo ... 6 = sábado): ["abre","cierra"] o null si ese día está cerrado.
create or replace function public.rest_dia(r public.restaurants, dow integer) returns jsonb
language sql stable as $$
  select case
    when r.horario is null then jsonb_build_array(public.rest_abre(r), public.rest_cierra(r))
    when jsonb_typeof(r.horario->dow) = 'array' then r.horario->dow
    else null end
$$;

-- ¿Ese momento cae dentro del horario de ese día? (para pedidos programados: se puede hasta la hora de cerrar)
create or replace function public.rest_en_horario(r public.restaurants, t timestamptz) returns boolean
language sql stable as $$
  with x as (select (t at time zone 'America/Bogota') as l)
  select coalesce((
    select (x.l::time >= (d->>0)::time and x.l::time <= (d->>1)::time)
    from x, lateral (select public.rest_dia(r, extract(dow from x.l)::integer) as d) z
    where d is not null), false)
$$;

-- ¿Abierto ahora mismo? Botón en "Abierto" y (si puso horario) dentro del horario de hoy.
create or replace function public.rest_abierto(r public.restaurants) returns boolean
language sql stable as $$
  select r.open and (
    r.horario is null or coalesce((
      select ((now() at time zone 'America/Bogota')::time >= (d->>0)::time and (now() at time zone 'America/Bogota')::time < (d->>1)::time)
      from (select public.rest_dia(r, extract(dow from (now() at time zone 'America/Bogota'))::integer) as d) z
      where d is not null), false))
$$;

-- ---------- Hacer un pedido: igual que 009, pero con el horario por día ----------
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
  v_when timestamptz;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  select * into r from public.restaurants where id = p->>'rest_id';
  if not found then raise exception 'no_restaurant'; end if;
  -- Pedido programado: entre 40 minutos y 2 días desde ahora, dentro del horario de ese día (hora de Colombia).
  v_when := nullif(p->>'scheduled_for', '')::timestamptz;
  if v_when is not null then
    if v_when < now() + interval '40 minutes' then raise exception 'too_soon'; end if;
    if v_when > now() + interval '2 days' then raise exception 'too_late'; end if;
    if not public.rest_en_horario(r, v_when) then raise exception 'out_of_hours'; end if;
  elsif not public.rest_abierto(r) then
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
