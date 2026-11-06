-- Bibliothèque partagée automatiquement : trace l'auteur d'un exercice
-- (pour le badge « Nouveau » et pour réserver l'édition/suppression à
-- l'auteur et à l'admin). Les blocs de séance gardent leur propre
-- copie du contenu de l'exercice au moment où il est ajouté (comme
-- duree_minutes déjà aujourd'hui), pour que supprimer un exercice de
-- la bibliothèque ne casse jamais les séances déjà construites.

alter table exercises add column if not exists author_id uuid references members(id) on delete set null;

alter table seance_blocs add column if not exists titre text;
alter table seance_blocs add column if not exists partie text;
alter table seance_blocs add column if not exists consignes text;
alter table seance_blocs add column if not exists media_type text;
alter table seance_blocs add column if not exists media_url text;
alter table seance_blocs add column if not exists media_platform text;

update seance_blocs sb
set titre = e.titre,
    partie = e.partie,
    consignes = e.consignes,
    media_type = e.media_type,
    media_url = e.media_url,
    media_platform = e.media_platform
from exercises e
where e.id = sb.exercice_id and sb.titre is null;

alter table seance_blocs alter column exercice_id drop not null;
alter table seance_blocs drop constraint if exists seance_blocs_exercice_id_fkey;
alter table seance_blocs
  add constraint seance_blocs_exercice_id_fkey
  foreign key (exercice_id) references exercises(id) on delete set null;
