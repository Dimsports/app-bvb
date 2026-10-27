-- Convocations à un match : l'entraineur convoque, le joueur confirme
-- ou décline. Même modèle de sécurité : RLS activée sans policy, accès
-- uniquement via le serveur (service_role).

create table if not exists match_convocations (
  match_id uuid not null references matches(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  statut text not null default 'en_attente',
  convoque_at timestamptz not null default now(),
  reponse_at timestamptz,
  primary key (match_id, member_id),
  constraint match_convocations_statut_check check (
    statut in ('en_attente', 'confirme', 'decline')
  )
);

create index if not exists match_convocations_member_id_idx on match_convocations (member_id);

alter table match_convocations enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
