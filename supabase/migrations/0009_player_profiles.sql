-- Fiche joueur : infos complémentaires, séparées de members pour ne pas
-- alourdir la table avec des colonnes qui ne concernent que les joueurs.
-- Même modèle de sécurité : RLS activée sans policy, accès uniquement via
-- le serveur (service_role).

create table if not exists player_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  date_naissance date,
  poste text,
  contact_nom text,
  contact_telephone text,
  contact_email text,
  updated_at timestamptz not null default now()
);

drop trigger if exists player_profiles_set_updated_at on player_profiles;
create trigger player_profiles_set_updated_at
  before update on player_profiles
  for each row
  execute function set_updated_at();

alter table player_profiles enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
