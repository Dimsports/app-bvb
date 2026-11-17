-- BVB Book (référentiel de compétences) + évaluations des joueurs.
--
-- Écart assumé par rapport à la spécification : pas de table
-- `competence_domains` séparée. Les 5 domaines du BVB Book
-- (Fondamentaux offensifs/défensifs, Jeu collectif, Physique et
-- motricité, Mental et comportement) sont exactement les mêmes 5
-- familles déjà créées pour les thématiques de la bibliothèque
-- (theme_families). Dupliquer ce référentiel aurait obligé l'admin à
-- le tenir à jour à deux endroits ; competences.domain_id référence
-- donc directement theme_families(id).
--
-- Confidentialité : mêmes règles de sécurité que le reste de l'appli
-- (RLS activée sans policy, accès uniquement via service_role). Pour
-- les évaluations, la confidentialité réelle vient du serveur : aucune
-- route ni requête accessible à une session "joueur" ne doit jamais
-- lire ces tables (voir lib/evaluations/).

create table if not exists competences (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  domain_id uuid not null references theme_families(id) on delete restrict,
  categories text[] not null default '{}',
  description text,
  criteres text,
  media_type text,
  media_url text,
  media_platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competences_media_type_check check (
    media_type is null or media_type in ('photo', 'video', 'lien')
  )
);

create index if not exists competences_domain_id_idx on competences (domain_id);

drop trigger if exists competences_set_updated_at on competences;
create trigger competences_set_updated_at
  before update on competences
  for each row
  execute function set_updated_at();

create table if not exists competence_exercises (
  competence_id uuid not null references competences(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  primary key (competence_id, exercise_id)
);

create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references members(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  periode text not null,
  date date not null default current_date,
  auteur_id uuid references members(id) on delete set null,
  commentaire_general text,
  created_at timestamptz not null default now()
);

create index if not exists evaluations_player_id_idx on evaluations (player_id, date desc);
create index if not exists evaluations_team_id_idx on evaluations (team_id);

create table if not exists evaluation_items (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  competence_id uuid not null references competences(id) on delete cascade,
  niveau text not null check (niveau in ('non_acquis', 'en_cours', 'acquis', 'maitrise')),
  commentaire text,
  unique (evaluation_id, competence_id)
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('competence-media', 'competence-media', true, 52428800)
on conflict (id) do nothing;

alter table competences enable row level security;
alter table competence_exercises enable row level security;
alter table evaluations enable row level security;
alter table evaluation_items enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
