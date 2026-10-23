-- Équipes : fiche (catégorie, genre, gymnase), créneaux d'entraînement,
-- staff (entraineurs/coachs rattachés) et effectif (joueurs). Même modèle
-- de sécurité que members : RLS activée, aucune policy, accès uniquement
-- via le serveur (service_role).

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  categorie text not null,
  genre text not null,
  nom text,
  gymnase text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_categorie_check check (
    categorie in ('U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U18', 'Seniors')
  ),
  constraint teams_genre_check check (genre in ('F', 'M', 'Mixte'))
);

drop trigger if exists teams_set_updated_at on teams;
create trigger teams_set_updated_at
  before update on teams
  for each row
  execute function set_updated_at();

create table if not exists team_creneaux (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  jour smallint not null,
  heure_debut time not null,
  heure_fin time not null,
  lieu text,
  constraint team_creneaux_jour_check check (jour between 1 and 7),
  constraint team_creneaux_heures_check check (heure_fin > heure_debut)
);

create index if not exists team_creneaux_team_id_idx on team_creneaux (team_id);

create table if not exists team_staff (
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  primary key (team_id, member_id)
);

create table if not exists team_roster (
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  primary key (team_id, member_id)
);

create index if not exists team_staff_member_id_idx on team_staff (member_id);
create index if not exists team_roster_member_id_idx on team_roster (member_id);

alter table teams enable row level security;
alter table team_creneaux enable row level security;
alter table team_staff enable row level security;
alter table team_roster enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
