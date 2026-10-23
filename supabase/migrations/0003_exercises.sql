-- Bibliothèque d'exercices du club : titre, partie de séance, durée par
-- défaut, consignes, tags, média (lien externe ou fichier uploadé).
-- Même modèle de sécurité que members/teams : RLS activée sans policy,
-- accès uniquement via le serveur (service_role).

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  partie text not null,
  duree_defaut_minutes smallint,
  consignes text,
  tags text[] not null default '{}',
  media_type text,
  media_url text,
  media_platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_partie_check check (
    partie in ('echauffement', 'fondamentaux', 'theme', 'jeu', 'retour_calme')
  ),
  constraint exercises_media_type_check check (
    media_type is null or media_type in ('photo', 'video', 'lien')
  )
);

create index if not exists exercises_partie_idx on exercises (partie);
create index if not exists exercises_tags_idx on exercises using gin (tags);

drop trigger if exists exercises_set_updated_at on exercises;
create trigger exercises_set_updated_at
  before update on exercises
  for each row
  execute function set_updated_at();

alter table exercises enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.

-- Bucket public pour les photos/vidéos d'exercices : lecture directe par
-- URL (nécessaire pour <img>/<video>), écriture uniquement via
-- service_role côté serveur (aucune policy d'upload pour anon/authenticated).
insert into storage.buckets (id, name, public, file_size_limit)
values ('exercise-media', 'exercise-media', true, 52428800)
on conflict (id) do nothing;
