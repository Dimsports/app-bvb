-- Fil d'annonces du club : publié par entraineur/admin, visible par
-- tous les membres connectés. Même modèle de sécurité : RLS activée
-- sans policy, accès uniquement via le serveur (service_role).

create table if not exists annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text not null,
  author_id uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists annonces_created_at_idx on annonces (created_at desc);

alter table annonces enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
