-- Pido y Ido 011: "Mis premios", el resumen de la tarjeta de sellos para el cliente.
--   No cambia la regla del premio (esa sigue en reward_state, archivo 006). Solo suma los totales
--   que el cliente ve en su pantalla: pedidos entregados, premios ganados, premios usados y cuánto ahorró.
--   Si la regla cambia (otro monto, un porcentaje, otro número de pedidos), esta pantalla sigue funcionando.
-- Necesita antes: 006-clientes-fieles.sql.
-- Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.

create or replace function public.my_reward_summary() returns jsonb
language sql stable security definer set search_path = public as $$
  with rw as (select public.reward_state(auth.uid()) as j),
  x as (
    select
      count(*) filter (where status = 'entregado') as delivered,
      count(*) filter (where discount > 0 and status not in ('rechazado', 'cancelado')) as used,
      coalesce(sum(discount) filter (where discount > 0 and status not in ('rechazado', 'cancelado')), 0) as saved,
      min(created_at) filter (where status = 'entregado') as since
    from public.orders where customer_uid = auth.uid()
  )
  select rw.j || jsonb_build_object(
    'delivered', x.delivered,
    'used', x.used,
    'saved', x.saved,
    'since', x.since,
    -- premios ganados = los ya usados + los que están listos para usar
    'earned', x.used + floor(coalesce((rw.j->>'stamps')::integer, 0)::numeric / greatest(coalesce((rw.j->>'every')::integer, 5) - 1, 1))::integer
  )
  from rw, x
$$;
revoke all on function public.my_reward_summary() from public, anon;
grant execute on function public.my_reward_summary() to authenticated;
