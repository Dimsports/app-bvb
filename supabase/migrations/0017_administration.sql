-- Fondation de l'espace Administration : modules activables par le club
-- (club_features), réglages du club (club_settings, ligne unique),
-- journal des actions sensibles (club_journal). Même modèle de
-- sécurité : RLS activée sans policy, accès uniquement via le serveur
-- (service_role).

create table if not exists club_features (
  module text primary key,
  enabled boolean not null default true,
  roles text[] not null default array['admin', 'entraineur', 'coach', 'joueur', 'benevole']::text[]
);

insert into club_features (module, enabled, roles) values
  ('seances', true, array['admin', 'entraineur', 'coach']),
  ('mode_terrain', true, array['admin', 'entraineur', 'coach']),
  ('matchs', true, array['admin', 'entraineur', 'coach']),
  ('saison', true, array['admin', 'entraineur', 'coach']),
  ('joueurs', true, array['admin', 'entraineur', 'coach']),
  ('questionnaires', true, array['admin', 'joueur']),
  ('benevoles', true, array['admin', 'benevole']),
  ('projet_club', true, array['admin', 'entraineur']),
  ('communication', true, array['admin', 'entraineur', 'coach', 'joueur', 'benevole'])
on conflict (module) do nothing;

create table if not exists club_settings (
  id int primary key default 1,
  nom text not null default 'BVB Le Poiré - Les Lucs',
  logo_url text,
  saison_debut date,
  saison_fin date,
  gymnases text[] not null default '{}',
  categories text[] not null default array['U9', 'U11', 'U13', 'U15', 'U17', 'U18'],
  constraint club_settings_singleton check (id = 1)
);

insert into club_settings (id) values (1) on conflict (id) do nothing;

create table if not exists club_journal (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references members(id) on delete set null,
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

create index if not exists club_journal_created_at_idx on club_journal (created_at desc);

alter table club_features enable row level security;
alter table club_settings enable row level security;
alter table club_journal enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
