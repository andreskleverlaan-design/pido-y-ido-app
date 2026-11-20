-- Pido y Ido · paso 6: los clientes sugieren negocios que faltan en "Pronto en Pido y Ido"
-- Una sugerencia aparece en la app cuando tú la apruebas (status = 'aprobado' en Table Editor > pronto_suggest)
-- o cuando 3 personas distintas sugieren el mismo negocio. Con status = 'rechazado' no aparece nunca.
-- Pegar en Supabase > SQL Editor > Run. Se puede correr varias veces. Necesita el paso 5 (pronto_votes).

create table if not exists public.pronto_suggest (
  id bigint generated always as identity primary key,
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null check (char_length(name) between 2 and 80),
  kind text not null check (kind in ('restaurante','drogueria','minimercado','licorera','floristeria','ferreteria','otro')),
  town text not null check (char_length(town) between 2 and 40),
  note text check (note is null or char_length(note) <= 300),
  uid uuid not null default auth.uid(),
  status text not null default 'nuevo' check (status in ('nuevo','aprobado','rechazado')),
  created_at timestamptz not null default now(),
  unique (slug, uid)
);
alter table public.pronto_suggest enable row level security;
revoke all on public.pronto_suggest from anon, authenticated;

-- Sugerir (máx. 5 por persona por día). También cuenta como "yo también lo quiero".
create or replace function public.suggest_biz(p_slug text, p_name text, p_kind text, p_town text, p_note text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  if (select count(*) from public.pronto_suggest where uid = auth.uid() and created_at > now() - interval '1 day') >= 5 then return 'limite'; end if;
  insert into public.pronto_suggest (slug, name, kind, town, note)
  values (p_slug, btrim(p_name), p_kind, btrim(p_town), nullif(btrim(coalesce(p_note, '')), ''))
  on conflict (slug, uid) do nothing;
  insert into public.pronto_votes (slug, uid) values (p_slug, auth.uid()) on conflict do nothing;
  return 'ok';
end $$;

-- Las sugerencias que ya se muestran en la app.
create or replace function public.pronto_extra()
returns table (slug text, name text, kind text, town text)
language sql stable security definer set search_path = public as $$
  with agg as (
    select s.slug, bool_or(s.status = 'aprobado') ok, bool_or(s.status = 'rechazado') no, count(distinct s.uid) n
    from public.pronto_suggest s group by s.slug
  )
  select distinct on (s.slug) s.slug, s.name, s.kind, s.town
  from public.pronto_suggest s join agg on agg.slug = s.slug
  where not agg.no and (agg.ok or agg.n >= 3)
  order by s.slug, (s.status = 'aprobado') desc, s.id;
$$;

revoke execute on function public.suggest_biz(text, text, text, text, text) from public, anon;
revoke execute on function public.pronto_extra() from public;
grant execute on function public.suggest_biz(text, text, text, text, text) to authenticated;
grant execute on function public.pronto_extra() to anon, authenticated;
