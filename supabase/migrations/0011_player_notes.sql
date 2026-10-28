-- Notes de progression : observations du staff sur un joueur au fil du
-- temps. Contrairement au bien-être, ce ne sont pas des données de santé :
-- visibles par l'ensemble du staff de l'équipe (entraineur, coach, admin).
-- Même modèle de sécurité : RLS activée sans policy, accès uniquement via
-- le serveur (service_role).

create table if not exists player_notes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  author_id uuid not null references members(id) on delete cascade,
  contenu text not null,
  created_at timestamptz not null default now()
);

create index if not exists player_notes_member_id_idx on player_notes (member_id, created_at desc);

alter table player_notes enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
