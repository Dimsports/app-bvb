-- Projet club : objectifs et actions associées (responsable, échéance,
-- statut). Visible/éditable par entraineur et admin uniquement. Même
-- modèle de sécurité : RLS activée sans policy, accès uniquement via le
-- serveur (service_role).

create table if not exists projet_objectifs (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists projet_objectifs_set_updated_at on projet_objectifs;
create trigger projet_objectifs_set_updated_at
  before update on projet_objectifs
  for each row
  execute function set_updated_at();

create table if not exists projet_actions (
  id uuid primary key default gen_random_uuid(),
  objectif_id uuid not null references projet_objectifs(id) on delete cascade,
  titre text not null,
  responsable_id uuid references members(id) on delete set null,
  echeance date,
  statut text not null default 'a_faire',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projet_actions_statut_check check (statut in ('a_faire', 'en_cours', 'fait'))
);

create index if not exists projet_actions_objectif_id_idx on projet_actions (objectif_id);

drop trigger if exists projet_actions_set_updated_at on projet_actions;
create trigger projet_actions_set_updated_at
  before update on projet_actions
  for each row
  execute function set_updated_at();

alter table projet_objectifs enable row level security;
alter table projet_actions enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
