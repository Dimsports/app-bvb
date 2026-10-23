-- Membres du club et authentification par code.
-- Pas de Supabase Auth : toutes les lectures/écritures passent par le serveur
-- (service_role), jamais par un accès anonyme direct. RLS activée, sans
-- policy pour anon/authenticated, afin de bloquer tout accès PostgREST
-- direct même en cas de fuite de la clé anon.

create extension if not exists pgcrypto;

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  roles text[] not null default '{}',
  code_hash text not null,
  code_length smallint not null,
  must_change_code boolean not null default true,
  failed_attempts smallint not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_code_length_check check (code_length in (4, 6)),
  constraint members_roles_check check (
    roles <@ array['admin', 'entraineur', 'coach', 'joueur', 'benevole']::text[]
    and array_length(roles, 1) > 0
  )
);

create index if not exists members_nom_prenom_idx
  on members (lower(nom), lower(prenom));

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists members_set_updated_at on members;
create trigger members_set_updated_at
  before update on members
  for each row
  execute function set_updated_at();

alter table members enable row level security;
-- Aucune policy créée volontairement : anon/authenticated n'ont aucun accès.
-- Seule la clé service_role (utilisée uniquement côté serveur) contourne RLS.
