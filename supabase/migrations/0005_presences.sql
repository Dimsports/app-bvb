-- Appel rapide : un joueur est "présent" si une ligne existe pour la
-- séance. Même modèle de sécurité : RLS activée sans policy, accès
-- uniquement via le serveur (service_role).

create table if not exists seance_presences (
  seance_id uuid not null references seances(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  marked_at timestamptz not null default now(),
  primary key (seance_id, member_id)
);

create index if not exists seance_presences_member_id_idx on seance_presences (member_id);

alter table seance_presences enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
