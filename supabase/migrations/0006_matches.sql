-- Matchs importés depuis le calendrier FFBB. ffbb_numero est le numéro
-- de rencontre FFBB : clé naturelle unique utilisée pour ré-importer un
-- calendrier sans dupliquer (upsert). Même modèle de sécurité : RLS
-- activée sans policy, accès uniquement via le serveur (service_role).

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  ffbb_numero text not null unique,
  division text,
  adversaire text not null,
  domicile boolean not null default true,
  date date not null,
  heure time,
  salle text,
  score_bvb smallint,
  score_adversaire smallint,
  note_coach text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_team_id_idx on matches (team_id);
create index if not exists matches_date_idx on matches (date);

drop trigger if exists matches_set_updated_at on matches;
create trigger matches_set_updated_at
  before update on matches
  for each row
  execute function set_updated_at();

alter table matches enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
