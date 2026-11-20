-- Pido y Ido · paso 8: cada negocio tiene su pueblo.
-- Un pueblo pasa de "Pronto" a "Activo" en la app cuando tiene su primer negocio con menú (o tienda en el mapa).
-- Pegar en Supabase > SQL Editor > Run. Se puede correr varias veces. (Ya aplicado el 20 nov 2026.)
alter table public.restaurants add column if not exists town text not null default 'Villanueva';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'restaurants_town_len') then
    alter table public.restaurants add constraint restaurants_town_len check (char_length(town) between 2 and 40);
  end if;
end $$;
