-- Séances : une séance appartient à une équipe et une date, composée de
-- blocs ordonnés référençant un exercice de la bibliothèque avec sa
-- propre durée. Même modèle de sécurité : RLS activée sans policy,
-- accès uniquement via le serveur (service_role).

create table if not exists seances (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  date date not null,
  heure_debut time,
  heure_fin time,
  titre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seances_team_id_idx on seances (team_id);
create index if not exists seances_date_idx on seances (date);

drop trigger if exists seances_set_updated_at on seances;
create trigger seances_set_updated_at
  before update on seances
  for each row
  execute function set_updated_at();

create table if not exists seance_blocs (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references seances(id) on delete cascade,
  exercice_id uuid not null references exercises(id) on delete cascade,
  ordre smallint not null,
  duree_minutes smallint not null
);

create index if not exists seance_blocs_seance_id_idx on seance_blocs (seance_id);

alter table seances enable row level security;
alter table seance_blocs enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
