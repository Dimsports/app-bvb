-- Questionnaires bien-être : données de santé. D'après le brief projet,
-- visibles uniquement par les entraîneurs (pas les coachs) et l'admin.
-- Même modèle de sécurité : RLS activée sans policy, accès uniquement via
-- le serveur (service_role).

create table if not exists wellbeing_entries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  date date not null default current_date,
  sommeil smallint not null,
  forme smallint not null,
  courbatures smallint not null,
  moral smallint not null,
  commentaire text,
  created_at timestamptz not null default now(),
  constraint wellbeing_entries_scale_check check (
    sommeil between 1 and 5
    and forme between 1 and 5
    and courbatures between 1 and 5
    and moral between 1 and 5
  ),
  unique (member_id, date)
);

create index if not exists wellbeing_entries_member_id_idx on wellbeing_entries (member_id, date desc);

alter table wellbeing_entries enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
