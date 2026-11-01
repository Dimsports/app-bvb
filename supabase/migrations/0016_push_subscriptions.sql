-- Abonnements aux notifications push (Web Push API). Un membre peut
-- avoir plusieurs abonnements (un par appareil/navigateur). Même modèle
-- de sécurité : RLS activée sans policy, accès uniquement via le
-- serveur (service_role).

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_member_id_idx on push_subscriptions (member_id);

alter table push_subscriptions enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
