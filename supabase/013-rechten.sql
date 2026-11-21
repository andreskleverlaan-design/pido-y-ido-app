-- Pido y Ido 013: la app vuelve a poder leer las tablas (los permisos de tabla se habían perdido).
-- Las reglas por fila (RLS) siguen activas: cada uno solo ve y cambia lo suyo.
-- Pega este archivo en Supabase > SQL Editor y pulsa "Run". Se puede ejecutar otra vez sin problema.
grant select, insert, delete on public.restaurants to anon, authenticated;
grant select on public.orders to anon, authenticated;
grant select on public.order_pins to anon, authenticated;
grant select, insert, update, delete on public.riders to anon, authenticated;
grant select, insert, update, delete on public.rest_riders to anon, authenticated;
grant select, insert, update, delete on public.promoters to anon, authenticated;
