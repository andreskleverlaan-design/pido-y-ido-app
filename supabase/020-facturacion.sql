-- Pido y Ido: Facturación. El negocio avisa que pagó la factura del mes (comisión a Pido y Ido)
-- y Pido y Ido lo confirma en su página de administración (#/admin/<clave>).
-- La factura misma se calcula con rest_resumen_mes (010-resumen-mes.sql). Se puede ejecutar otra vez.

create table if not exists public.factura_pagos (
  rest_id text not null references public.restaurants(id) on delete cascade,
  mes text not null check (mes ~ '^\d{4}-\d{2}$'),
  monto integer not null default 0 check (monto >= 0),
  metodo text not null check (metodo in ('nequi', 'banco', 'breb', 'otro')),
  referencia text not null default '' check (length(referencia) <= 60),
  estado text not null default 'enviado' check (estado in ('enviado', 'pagado', 'no_llego')),
  enviado_at timestamptz not null default now(),
  revisado_at timestamptz,
  primary key (rest_id, mes)
);
alter table public.factura_pagos enable row level security;
revoke all on public.factura_pagos from anon, authenticated;
grant select on public.factura_pagos to authenticated;
drop policy if exists factura_pagos_own on public.factura_pagos;
create policy factura_pagos_own on public.factura_pagos for select to authenticated
  using (exists (select 1 from public.restaurants r where r.id = rest_id and r.owner = auth.uid()));

-- El negocio avisa "Ya pagué". Solo meses cerrados; una factura ya confirmada no se cambia.
create or replace function public.rest_factura_pagada(p_mes text, p_metodo text, p_monto integer, p_ref text) returns text
language plpgsql security definer set search_path = public as $$
declare v_rest text; v_cur text := to_char(now() at time zone 'America/Bogota', 'YYYY-MM');
begin
  select id into v_rest from public.restaurants where owner = auth.uid() order by created_at limit 1;
  if v_rest is null then raise exception 'no_rest'; end if;
  if p_mes is null or p_mes !~ '^\d{4}-\d{2}$' or p_mes >= v_cur then raise exception 'mes_abierto'; end if;
  if p_metodo not in ('nequi', 'banco', 'breb', 'otro') then raise exception 'metodo'; end if;
  insert into public.factura_pagos (rest_id, mes, monto, metodo, referencia)
    values (v_rest, p_mes, greatest(coalesce(p_monto, 0), 0), p_metodo, left(coalesce(p_ref, ''), 60))
  on conflict (rest_id, mes) do update set monto = excluded.monto, metodo = excluded.metodo, referencia = excluded.referencia,
    estado = 'enviado', enviado_at = now(), revisado_at = null
    where public.factura_pagos.estado <> 'pagado';
  return 'ok';
end $$;
revoke execute on function public.rest_factura_pagada(text, text, integer, text) from public, anon;
grant execute on function public.rest_factura_pagada(text, text, integer, text) to authenticated;

-- Pido y Ido: pagos avisados (primero los que esperan revisión).
create or replace function public.admin_facturas(p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('rest_id', f.rest_id, 'name', r.name, 'mes', f.mes, 'monto', f.monto, 'metodo', f.metodo,
      'referencia', f.referencia, 'estado', f.estado, 'enviado_at', f.enviado_at, 'pct', r.comision_pct)
    order by (f.estado = 'enviado') desc, f.enviado_at desc)
    from public.factura_pagos f join public.restaurants r on r.id = f.rest_id), '[]'::jsonb);
end $$;
revoke execute on function public.admin_facturas(text) from public;
grant execute on function public.admin_facturas(text) to anon, authenticated;

create or replace function public.admin_factura_set(p_key text, p_rest text, p_mes text, p_estado text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_ok(p_key) then raise exception 'not_admin'; end if;
  if p_estado not in ('pagado', 'no_llego', 'enviado') then raise exception 'estado'; end if;
  update public.factura_pagos set estado = p_estado, revisado_at = now() where rest_id = p_rest and mes = p_mes;
  if not found then return 'no_existe'; end if;
  return 'ok';
end $$;
revoke execute on function public.admin_factura_set(text, text, text, text) from public;
grant execute on function public.admin_factura_set(text, text, text, text) to anon, authenticated;
