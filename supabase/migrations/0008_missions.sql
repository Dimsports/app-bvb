-- Missions bénévoles d'un match (table de marque, buvette...) : besoin
-- défini par l'entraineur/admin, inscription libre par les bénévoles
-- (vue transverse à tout le club, pas limitée à une équipe). Même
-- modèle de sécurité : RLS activée sans policy, accès uniquement via
-- le serveur (service_role).

create table if not exists match_missions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  titre text not null,
  besoin smallint not null default 1
);

create index if not exists match_missions_match_id_idx on match_missions (match_id);

create table if not exists match_mission_inscriptions (
  mission_id uuid not null references match_missions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  inscrit_at timestamptz not null default now(),
  primary key (mission_id, member_id)
);

create index if not exists match_mission_inscriptions_member_id_idx
  on match_mission_inscriptions (member_id);

alter table match_missions enable row level security;
alter table match_mission_inscriptions enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
