-- Accès par membre : permet à l'admin de forcer l'autorisation ou le
-- blocage d'un module pour un membre précis, indépendamment de son
-- rôle. Absence de ligne = comportement par défaut du rôle
-- (club_features). Même modèle de sécurité : RLS activée sans policy,
-- accès uniquement via le serveur (service_role).

create table if not exists member_feature_overrides (
  member_id uuid not null references members(id) on delete cascade,
  module text not null,
  granted boolean not null,
  created_at timestamptz not null default now(),
  primary key (member_id, module)
);

alter table member_feature_overrides enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
