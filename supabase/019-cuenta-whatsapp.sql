-- Pido y Ido 019: el cliente confirma su número con un código por WhatsApp.
-- 1. Sus sellos y pedidos quedan en su número: si cambia de celular, entra con el mismo número y lo recupera todo.
-- 2. Lo que hizo en este celular antes de confirmar se suma a su cuenta (no pierde nada).
-- 3. El negocio ve el número confirmado (no uno inventado).
-- 4. Pido y Ido ve la historia de cada cliente por número (pedidos, cancelados, no pagó, reclamos) y puede bloquear.
-- 5. Interruptor en #/admin: "Pedir número confirmado para pedir" (apagado hasta que WhatsApp funcione).
-- El código lo manda Supabase Auth por el "Send SMS hook" → esta base → WhatsApp (Meta Cloud API).
-- Necesita 018-sin-revision.sql. Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez.

create extension if not exists pg_net;

-- ---------- Ajustes ----------
alter table public.pyi_settings add column if not exists need_phone boolean not null default false;
alter table public.orders add column if not exists phone_ok boolean not null default false;

create or replace function public.pyi_need_phone() returns boolean
language sql stable security definer set search_path = public as $$ select coalesce((select need_phone from public.pyi_settings where id = 1), false) $$;
revoke execute on function public.pyi_need_phone() from public, anon;
grant execute on function public.pyi_need_phone() to authenticated;

-- Número confirmado del usuario que hace la llamada (10 dígitos) o null.
create or replace function public.pyi_my_phone() returns text
language sql stable security definer set search_path = public as $$
  select right(u.phone, 10) from auth.users u
  where u.id = auth.uid() and coalesce(u.phone, '') <> '' and u.phone_confirmed_at is not null and not coalesce(u.is_anonymous, false)
$$;
revoke execute on function public.pyi_my_phone() from public, anon;
grant execute on function public.pyi_my_phone() to authenticated;

-- ---------- Bloqueados ----------
create table if not exists public.pyi_blocked (
  phone text primary key check (phone ~ '^[0-9]{10}$'),
  reason text,
  at timestamptz not null default now()
);
alter table public.pyi_blocked enable row level security;
revoke all on public.pyi_blocked from anon, authenticated;

create or replace function public.pyi_is_blocked(p_phone text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pyi_blocked where phone = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10))
$$;
revoke execute on function public.pyi_is_blocked(text) from public, anon;
grant execute on function public.pyi_is_blocked(text) to authenticated;

-- ---------- Guardia de pedidos (017 + número confirmado + bloqueo) ----------
create or replace function public.orders_guard() returns trigger
language plpgsql set search_path = public as $$
declare n int; v_phone text;
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.restaurants where id = new.rest_id and aprobado) then
      raise exception 'not_approved';
    end if;
    if new.customer_uid is not null then
      -- 019: número confirmado por WhatsApp → ese es el número del pedido.
      if new.customer_uid = auth.uid() then v_phone := public.pyi_my_phone(); end if;
      if v_phone is not null then
        new.customer := jsonb_set(coalesce(new.customer, '{}'::jsonb), '{phone}', to_jsonb(v_phone));
        new.phone_ok := true;
      else
        new.phone_ok := false;
        if public.pyi_need_phone() then raise exception 'need_phone'; end if;
      end if;
      if public.pyi_is_blocked(coalesce(v_phone, new.customer->>'phone')) then raise exception 'blocked'; end if;
      select count(*) into n from public.orders
        where customer_uid = new.customer_uid and status in ('recibido', 'preparando', 'listo', 'en_camino')
          and created_at > now() - interval '12 hours';
      if n >= 3 then raise exception 'too_many_open'; end if;
      select count(*) into n from public.orders
        where customer_uid = new.customer_uid and created_at > now() - interval '1 hour';
      if n >= 6 then raise exception 'too_many'; end if;
    end if;
    return new;
  end if;
  -- UPDATE hecho directamente por el negocio desde la app (las funciones del sistema no pasan por aquí).
  if current_user in ('anon', 'authenticated') and new.status is distinct from old.status
     and old.status in ('entregado', 'rechazado', 'cancelado', 'no_entregado', 'sin_respuesta') then
    raise exception 'order_closed';
  end if;
  if current_user in ('anon', 'authenticated') then new.phone_ok := old.phone_ok; end if;
  return new;
end $$;
revoke execute on function public.orders_guard() from public, anon, authenticated;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before insert or update on public.orders
  for each row execute function public.orders_guard();

-- ---------- Pasar lo de este celular a la cuenta con número ----------
-- Antes de entrar, el celular (cuenta anónima) pide un vale; después de entrar con el código, lo canjea.
create table if not exists public.cust_tickets (
  token text primary key,
  uid uuid not null,
  created_at timestamptz not null default now()
);
alter table public.cust_tickets enable row level security;
revoke all on public.cust_tickets from anon, authenticated;

create or replace function public.cust_ticket() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v text;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  if not exists (select 1 from auth.users where id = auth.uid() and is_anonymous) then return null; end if;
  delete from public.cust_tickets where uid = auth.uid() or created_at < now() - interval '1 day';
  v := encode(gen_random_bytes(18), 'hex');
  insert into public.cust_tickets (token, uid) values (v, auth.uid());
  return v;
end $$;
revoke execute on function public.cust_ticket() from public, anon;
grant execute on function public.cust_ticket() to authenticated;

create or replace function public.cust_merge(p_token text) returns integer
language plpgsql security definer set search_path = public as $$
declare v_old uuid; v_new uuid := auth.uid(); n int := 0;
begin
  if public.pyi_my_phone() is null then raise exception 'no_phone'; end if;
  delete from public.cust_tickets t where t.token = coalesce(p_token, '') and t.created_at > now() - interval '1 hour'
    returning t.uid into v_old;
  if v_old is null or v_old = v_new then return 0; end if;
  if not exists (select 1 from auth.users where id = v_old and is_anonymous) then return 0; end if;
  update public.orders set customer_uid = v_new where customer_uid = v_old;
  get diagnostics n = row_count;
  insert into public.pronto_votes (slug, uid, created_at)
    select slug, v_new, created_at from public.pronto_votes where uid = v_old on conflict do nothing;
  delete from public.pronto_votes where uid = v_old;
  update public.pronto_suggest set uid = v_new where uid = v_old;
  if not exists (select 1 from public.promoters where owner = v_new) then
    update public.promoters set owner = v_new where owner = v_old;
  end if;
  if not exists (select 1 from public.riders where owner = v_new) then
    update public.riders set owner = v_new where owner = v_old;
  end if;
  return n;
end $$;
revoke execute on function public.cust_merge(text) from public, anon;
grant execute on function public.cust_merge(text) to authenticated;

-- ---------- Mandar el código por WhatsApp (Supabase Auth > Hooks > Send SMS) ----------
-- Lee el token de Meta y el id del número desde Vault (ver 019b-claves-whatsapp.sql).
-- Plantilla de Meta: categoría Autenticación, nombre pyi_codigo, idioma español, botón "Copiar código".
create table if not exists public.pyi_sms_log (
  at timestamptz not null default now(),
  phone text not null,
  ok boolean not null,
  request_id bigint
);
alter table public.pyi_sms_log enable row level security;
revoke all on public.pyi_sms_log from anon, authenticated;

create or replace function public.pyi_send_sms(event jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_to text := regexp_replace(coalesce(event->'user'->>'phone', ''), '\D', '', 'g');
  v_otp text := event->'sms'->>'otp';
  v_token text; v_pid text; v_req bigint;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'whatsapp_token' limit 1;
  select decrypted_secret into v_pid from vault.decrypted_secrets where name = 'whatsapp_phone_id' limit 1;
  if coalesce(v_token, '') = '' or coalesce(v_pid, '') = '' or v_to = '' or coalesce(v_otp, '') = '' then
    insert into public.pyi_sms_log (phone, ok) values (right(v_to, 10), false);
    return jsonb_build_object('error', jsonb_build_object('http_code', 500, 'message', 'WhatsApp todavía no está configurado.'));
  end if;
  select net.http_post(
    url := 'https://graph.facebook.com/v21.0/' || v_pid || '/messages',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_token, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'messaging_product', 'whatsapp', 'to', v_to, 'type', 'template',
      'template', jsonb_build_object('name', 'pyi_codigo', 'language', jsonb_build_object('code', 'es'),
        'components', jsonb_build_array(
          jsonb_build_object('type', 'body', 'parameters', jsonb_build_array(jsonb_build_object('type', 'text', 'text', v_otp))),
          jsonb_build_object('type', 'button', 'sub_type', 'url', 'index', '0',
            'parameters', jsonb_build_array(jsonb_build_object('type', 'text', 'text', v_otp))))))
  ) into v_req;
  insert into public.pyi_sms_log (phone, ok, request_id) values (right(v_to, 10), true, v_req);
  return '{}'::jsonb;
end $$;
revoke execute on function public.pyi_send_sms(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.pyi_send_sms(jsonb) to supabase_auth_admin;

-- ---------- Página de Pido y Ido: clientes ----------
create or replace function public.pyi_phone10(c jsonb) returns text
language sql immutable as $$ select right(regexp_replace(coalesce(c->>'phone', ''), '\D', '', 'g'), 10) $$;

-- Un pedido "no pagó": el negocio lo cerró por falta de pago, o marcó que el pago no llegó.
create or replace function public.pyi_no_pago(o public.orders) returns boolean
language sql stable as $$
  select coalesce(o.pay_ok = false, false) or coalesce(o.reject_reason, '') ilike any (array['El cliente no pagó%', 'El pago no llegó%'])
$$;

create or replace function public.admin_clientes(p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  return coalesce((select jsonb_agg(to_jsonb(y) || jsonb_build_object('bloqueado', exists (select 1 from public.pyi_blocked b where b.phone = y.phone))
      order by y.problemas desc, y.ultimo desc) from (
    select public.pyi_phone10(o.customer) as phone,
      (array_agg(o.customer->>'name' order by o.created_at desc))[1] as name,
      bool_or(o.phone_ok) as confirmado,
      count(*) as pedidos,
      count(*) filter (where o.status = 'entregado') as entregados,
      count(*) filter (where o.status = 'cancelado') as cancelados,
      count(*) filter (where o.status = 'no_entregado' and coalesce(o.reject_reason, '') not like 'Tuvimos que cancelarlo%') as no_entregados,
      count(*) filter (where public.pyi_no_pago(o)) as no_pago,
      count(*) filter (where o.issue is not null) as reclamos,
      count(*) filter (where o.status = 'cancelado' or o.issue is not null or public.pyi_no_pago(o)
        or (o.status = 'no_entregado' and coalesce(o.reject_reason, '') not like 'Tuvimos que cancelarlo%')) as problemas,
      max(o.created_at) as ultimo
    from public.orders o
    where length(public.pyi_phone10(o.customer)) = 10
    group by 1
    order by problemas desc, ultimo desc
    limit 300) y), '[]'::jsonb);
end $$;
revoke execute on function public.admin_clientes(text) from public;
grant execute on function public.admin_clientes(text) to anon, authenticated;

create or replace function public.admin_cliente(p_key text, p_phone text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  return jsonb_build_object(
    'phone', v,
    'cuenta', (select jsonb_build_object('desde', min(u.phone_confirmed_at), 'ultimo', max(u.last_sign_in_at))
               from auth.users u where right(u.phone, 10) = v and u.phone_confirmed_at is not null),
    'bloqueo', (select jsonb_build_object('reason', b.reason, 'at', b.at) from public.pyi_blocked b where b.phone = v),
    'pedidos', coalesce((select jsonb_agg(jsonb_build_object(
        'id', o.id, 'at', o.created_at, 'rest', r.name, 'town', r.town, 'name', o.customer->>'name', 'address', o.customer->>'address',
        'total', o.total, 'pay', o.pay, 'status', o.status, 'reason', o.reject_reason, 'no_pago', public.pyi_no_pago(o),
        'issue', o.issue, 'issue_note', o.issue_note, 'rating', o.rating, 'phone_ok', o.phone_ok, 'by', o.delivered_by)
      order by o.created_at desc)
      from public.orders o left join public.restaurants r on r.id = o.rest_id
      where public.pyi_phone10(o.customer) = v), '[]'::jsonb));
end $$;
revoke execute on function public.admin_cliente(text, text) from public;
grant execute on function public.admin_cliente(text, text) to anon, authenticated;

create or replace function public.admin_block(p_key text, p_phone text, p_on boolean, p_reason text) returns text
language plpgsql security definer set search_path = public as $$
declare v text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  if length(v) <> 10 then return 'no'; end if;
  if p_on then
    insert into public.pyi_blocked (phone, reason) values (v, nullif(left(btrim(coalesce(p_reason, '')), 200), ''))
      on conflict (phone) do update set reason = excluded.reason, at = now();
  else
    delete from public.pyi_blocked where phone = v;
  end if;
  return 'ok';
end $$;
revoke execute on function public.admin_block(text, text, boolean, text) from public;
grant execute on function public.admin_block(text, text, boolean, text) to anon, authenticated;

-- Ajustes de la página: se suman "pedir número confirmado" y cuántos códigos salieron.
create or replace function public.admin_settings(p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  return jsonb_build_object('auto_visible', public.pyi_auto_visible(), 'need_phone', public.pyi_need_phone(),
    'codigos_30d', (select count(*) from public.pyi_sms_log where ok and at > now() - interval '30 days'),
    'codigos_fallidos_30d', (select count(*) from public.pyi_sms_log where not ok and at > now() - interval '30 days'),
    'whatsapp_listo', exists (select 1 from vault.secrets where name = 'whatsapp_token') and exists (select 1 from vault.secrets where name = 'whatsapp_phone_id'));
end $$;
revoke execute on function public.admin_settings(text) from public;
grant execute on function public.admin_settings(text) to anon, authenticated;

create or replace function public.admin_set_need_phone(p_key text, p_on boolean) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  update public.pyi_settings set need_phone = p_on where id = 1;
  return 'ok';
end $$;
revoke execute on function public.admin_set_need_phone(text, boolean) from public;
grant execute on function public.admin_set_need_phone(text, boolean) to anon, authenticated;

notify pgrst, 'reload schema';
