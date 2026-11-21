-- Pido y Ido 016: "¿Algo salió mal?"
-- * Hasta 24 horas después de la entrega, el cliente puede avisar un problema (una vez por pedido).
-- * El negocio lo ve en su pedido, puede escribirle al cliente y marcarlo como resuelto.
-- * Pido y Ido ve todos los reclamos en la tabla orders (issue no vacío).
-- Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

alter table public.orders
  add column if not exists issue text,
  add column if not exists issue_note text,
  add column if not exists issue_at timestamptz,
  add column if not exists issue_done_at timestamptz;

-- El cliente avisa el problema.
create or replace function public.report_issue(p_id bigint, p_kind text, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if auth.uid() is null then return 'no_session'; end if;
  select * into o from public.orders where id = p_id and customer_uid = auth.uid() for update;
  if not found then return 'no_existe'; end if;
  if o.status <> 'entregado' then return 'cerrado'; end if;
  if o.issue is not null then return 'ya'; end if;
  if coalesce(o.delivered_at, o.created_at) < now() - interval '24 hours' then return 'tarde'; end if;
  if coalesce(btrim(p_kind), '') = '' then return 'vacio'; end if;
  update public.orders set issue = left(btrim(p_kind), 60), issue_note = nullif(left(btrim(coalesce(p_note, '')), 300), ''), issue_at = now()
  where id = p_id;
  return 'ok';
end $$;

-- El negocio lo marca como resuelto.
create or replace function public.rest_issue_done(p_id bigint) returns text
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set issue_done_at = now()
  where id = p_id and rest_id in (select public.my_rest_ids()) and issue is not null and issue_done_at is null;
  return case when found then 'ok' else 'no' end;
end $$;

revoke execute on function public.report_issue(bigint, text, text) from public, anon;
revoke execute on function public.rest_issue_done(bigint) from public, anon;
grant execute on function public.report_issue(bigint, text, text) to authenticated;
grant execute on function public.rest_issue_done(bigint) to authenticated;
