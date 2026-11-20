-- Pido y Ido · paso 5: "X personas han pedido que este negocio se una"
-- Cuenta cuántas personas (una por celular) pidieron que un negocio que aún no está se una.
-- Pegar en Supabase > SQL Editor > Run. Se puede correr varias veces.

create table if not exists public.pronto_votes (
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  uid uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (slug, uid)
);
alter table public.pronto_votes enable row level security;
-- nadie lee ni escribe la tabla directo; solo por las dos funciones de abajo
revoke all on public.pronto_votes from anon, authenticated;

-- Registrar "yo también lo quiero" (una vez por persona y negocio). Devuelve el total.
create or replace function public.vote_pronto(p_slug text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  if p_slug !~ '^[a-z0-9-]{2,80}$' then raise exception 'slug'; end if;
  insert into public.pronto_votes (slug, uid) values (p_slug, auth.uid()) on conflict do nothing;
  select count(*) into n from public.pronto_votes where slug = p_slug;
  return n;
end $$;

-- Totales por negocio, y si esta persona ya lo pidió.
create or replace function public.pronto_counts()
returns table (slug text, n integer, mine boolean)
language sql stable security definer set search_path = public as $$
  select v.slug, count(*)::integer, bool_or(v.uid = auth.uid())
  from public.pronto_votes v group by v.slug;
$$;

revoke execute on function public.vote_pronto(text) from public, anon;
revoke execute on function public.pronto_counts() from public;
grant execute on function public.vote_pronto(text) to authenticated;
grant execute on function public.pronto_counts() to anon, authenticated;
