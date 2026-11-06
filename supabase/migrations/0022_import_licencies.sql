-- Import de comptes par fichier : la case « compte tenu par un
-- parent » n'existait encore nulle part dans le schéma (prévue dans
-- la fiche membre, jamais implémentée). Le téléphone parent réutilise
-- la colonne contact_telephone déjà existante sur player_profiles.

alter table player_profiles add column if not exists compte_tenu_par_parent boolean not null default false;
