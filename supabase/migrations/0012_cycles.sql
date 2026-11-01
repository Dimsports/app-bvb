-- Cycles d'entrainement : périodes simples (nom, dates, objectif libre)
-- rattachées à une équipe, pour regrouper des séances. Volontairement
-- minimal : pas de charge/intensité, pas de métrique sportive. Même
-- modèle de sécurité : RLS activée sans policy, accès uniquement via le
-- serveur (service_role).

create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  nom text not null,
  date_debut date not null,
  date_fin date not null,
  objectif text,
  created_at timestamptz not null default now(),
  constraint cycles_dates_check check (date_fin >= date_debut)
);

create index if not exists cycles_team_id_idx on cycles (team_id, date_debut);

alter table seances add column if not exists cycle_id uuid references cycles(id) on delete set null;
create index if not exists seances_cycle_id_idx on seances (cycle_id);

alter table cycles enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
