-- Remplace les tags génériques de la bibliothèque d'exercices par un
-- référentiel basket fixe (familles + thématiques), modifiable par
-- l'admin, et ajoute les filtres supplémentaires sur chaque exercice
-- (catégorie d'âge, nombre de joueurs, espace, matériel, intensité,
-- opposition). Même modèle de sécurité : RLS activée sans policy,
-- accès uniquement via le serveur (service_role).

create table if not exists theme_families (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  ordre smallint not null
);

create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references theme_families(id) on delete cascade,
  nom text not null,
  ordre smallint not null,
  unique (family_id, nom)
);

create table if not exists exercise_themes (
  exercise_id uuid not null references exercises(id) on delete cascade,
  theme_id uuid not null references themes(id) on delete cascade,
  primary key (exercise_id, theme_id)
);

insert into theme_families (nom, ordre) values
  ('Fondamentaux offensifs', 1),
  ('Fondamentaux défensifs', 2),
  ('Jeu collectif', 3),
  ('Physique et motricité', 4),
  ('Mental et comportement', 5)
on conflict (nom) do nothing;

insert into themes (family_id, nom, ordre)
select f.id, t.nom, t.ordre
from theme_families f
join (values
  ('Fondamentaux offensifs', 'Dribble et maniement', 1),
  ('Fondamentaux offensifs', 'Passe et réception', 2),
  ('Fondamentaux offensifs', 'Tir en course / finition', 3),
  ('Fondamentaux offensifs', 'Tir extérieur', 4),
  ('Fondamentaux offensifs', 'Lancer franc', 5),
  ('Fondamentaux offensifs', 'Jeu de pieds et appuis', 6),
  ('Fondamentaux offensifs', 'Arrêts et pivots', 7),
  ('Fondamentaux offensifs', '1c1 offensif', 8),
  ('Fondamentaux offensifs', 'Jeu dos au panier', 9),
  ('Fondamentaux offensifs', 'Rebond offensif', 10),
  ('Fondamentaux défensifs', 'Défense sur porteur', 1),
  ('Fondamentaux défensifs', 'Défense sur non-porteur', 2),
  ('Fondamentaux défensifs', 'Aide et rotation', 3),
  ('Fondamentaux défensifs', 'Défense poste bas', 4),
  ('Fondamentaux défensifs', 'Rebond défensif et box-out', 5),
  ('Fondamentaux défensifs', 'Contestation de tir', 6),
  ('Jeu collectif', 'Jeu sans ballon et démarquage', 1),
  ('Jeu collectif', 'Spacing', 2),
  ('Jeu collectif', 'Passe et va / passer-couper', 3),
  ('Jeu collectif', 'Écrans directs (pick and roll)', 4),
  ('Jeu collectif', 'Écrans indirects', 5),
  ('Jeu collectif', 'Surnombre (2c1, 3c2)', 6),
  ('Jeu collectif', 'Transition offensive / contre-attaque', 7),
  ('Jeu collectif', 'Repli défensif', 8),
  ('Jeu collectif', 'Attaque de zone', 9),
  ('Jeu collectif', 'Défense de zone', 10),
  ('Jeu collectif', 'Presse et attaque de presse', 11),
  ('Jeu collectif', 'Situations spéciales (remise en jeu, fin de match)', 12),
  ('Physique et motricité', 'Coordination', 1),
  ('Physique et motricité', 'Vitesse et réactivité', 2),
  ('Physique et motricité', 'Changements de direction', 3),
  ('Physique et motricité', 'Gainage et prévention', 4),
  ('Physique et motricité', 'Endurance spécifique', 5),
  ('Mental et comportement', 'Communication', 1),
  ('Mental et comportement', 'Concentration', 2),
  ('Mental et comportement', 'Leadership', 3),
  ('Mental et comportement', 'Fair-play', 4)
) as t(family_nom, nom, ordre) on t.family_nom = f.nom
on conflict (family_id, nom) do nothing;

alter table exercises add column if not exists categories text[] not null default '{}';
alter table exercises add column if not exists nb_joueurs_min smallint;
alter table exercises add column if not exists nb_joueurs_max smallint;
alter table exercises add column if not exists espace text;
alter table exercises add column if not exists materiel text[] not null default '{}';
alter table exercises add column if not exists intensite text;
alter table exercises add column if not exists opposition text;

alter table exercises add constraint exercises_espace_check
  check (espace is null or espace in ('demi_terrain', 'tout_terrain', 'atelier'));
alter table exercises add constraint exercises_intensite_check
  check (intensite is null or intensite in ('faible', 'moyenne', 'forte'));
alter table exercises add constraint exercises_opposition_check
  check (opposition is null or opposition in ('sans', 'partielle', 'totale'));

drop index if exists exercises_tags_idx;
alter table exercises drop column if exists tags;

alter table theme_families enable row level security;
alter table themes enable row level security;
alter table exercise_themes enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès, seul service_role
-- (serveur) contourne RLS.
