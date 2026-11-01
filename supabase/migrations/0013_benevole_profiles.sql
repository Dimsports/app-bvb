-- Profil bénévole : contact et disponibilités générales (texte libre,
-- pas un système de calendrier). Même modèle de sécurité : RLS activée
-- sans policy, accès uniquement via le serveur (service_role).

create table if not exists benevole_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  contact_telephone text,
  contact_email text,
  disponibilites text,
  updated_at timestamptz not null default now()
);

drop trigger if exists benevole_profiles_set_updated_at on benevole_profiles;
create trigger benevole_profiles_set_updated_at
  before update on benevole_profiles
  for each row
  execute function set_updated_at();

alter table benevole_profiles enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
