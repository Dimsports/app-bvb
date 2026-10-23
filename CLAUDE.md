# App BVB — brief projet pour Claude Code

Application interne du club **BVB Le Poiré - Les Lucs** (basket, Vendée). Outil gratuit pour gérer le club : équipes U9 à U18, séances, saison, matchs, joueurs, bénévoles, projet club. Environ 380 licenciés, plus le staff et les bénévoles.

Ce n'est PAS un produit commercial : pas d'offres, pas d'abonnements, pas de paiement.

L'interface est entièrement en français. Le code et les commentaires peuvent être en anglais.

## Principes (non négociables)

- **Clarté** : une page = une tâche. Aucun module qui ne sert pas chaque mois.
- **Rapidité** : toute action courante en 3 clics maximum (ouvrir la séance du jour, faire l'appel, voir le prochain match).
- **Mobile d'abord** : utilisable au bord du terrain sur téléphone, confortable sur ordinateur pour préparer.
- **Visuel professionnel** et identique sur toutes les pages (voir Design).
- **Coût zéro** : rester dans les offres gratuites de Supabase et de l'hébergeur.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS.
- Supabase : Postgres + Storage, projet en région Europe.
- Hébergement Vercel.
- PWA installable : manifest, icônes BVB, service worker, écran d'accueil iPhone et Android. Pas d'App Store.
- Pas de Supabase Auth par email : authentification maison par code (voir plus bas).

## Rôles

| Rôle | Voit | Fait |
| --- | --- | --- |
| admin | Tout le club | Gère équipes, membres, codes, projet club, imports FFBB |
| entraineur | Ses équipes + bibliothèque du club | Crée séances et cycles, fait l'appel, convoque, suit ses joueurs |
| coach | Équipes où il est rattaché | Consulte les séances, fait l'appel, saisit les résultats |
| joueur | Son planning, ses convocations, ses questionnaires | Confirme sa présence, répond aux questionnaires |
| benevole | Besoins du week-end | S'inscrit sur une mission |

Une personne peut cumuler plusieurs rôles. Pour les U9–U13, le compte joueur est tenu par un parent.

## Connexion par code (sans email)

1. L'admin crée le membre ; l'app génère un code. Le membre peut le changer ensuite.
2. Connexion : choisir son nom (recherche prénom + nom), puis taper son code sur un pavé numérique.
3. Code à 4 chiffres pour joueurs, coachs et bénévoles ; **6 chiffres pour admin et entraîneur**.
4. Le code est stocké haché (bcrypt ou argon2), jamais en clair.
5. Session dans un cookie httpOnly, secure, signé, valable 60 jours (le téléphone reste connecté).
6. Après 5 codes faux : blocage 15 minutes. L'admin réinitialise un code en un clic.
7. Toutes les lectures et écritures passent par le serveur (server actions / route handlers) qui vérifie la session et le rôle. La clé `service_role` Supabase reste côté serveur uniquement. RLS activée sur toutes les tables (aucun accès anonyme direct).

## Design

Identité tirée du logo (fourni : `public/logo-bvb.jpeg`).

- Couleurs : turquoise `#5CC6B1` (accent), anthracite `#23272B` (en-têtes, boutons principaux), fond `#F2F4F4`, cartes blanches. Texte turquoise sur fond blanc : utiliser `#0F6E60` pour le contraste.
- Mode terrain : fond sombre `#1A1D20`.
- Polices : Barlow Condensed 700 pour les titres, Inter pour le texte.
- Une couleur par partie de séance : échauffement `#F2A93B`, fondamentaux `#6FA8F5`, thème `#5CC6B1`, jeu `#B79CF2`, retour au calme `#9AA5AA`.
- Navigation : barre d'onglets en bas sur téléphone (Accueil, Séances, Équipes, Matchs, Plus), barre latérale sur ordinateur.
- Cibles tactiles de 44 px minimum, contrastes AA, icônes en trait (pas d'emoji).
- **Les maquettes validées sont dans le dossier `maquettes/`** : `Connexion.html`, `Main.html` (accueil), `Seance.html` (création de séance), `Terrain.html` (mode terrain), `Match.html`. Elles font foi : reproduire fidèlement leur mise en page, leurs couleurs, tailles, espacements, textes et comportements (pavé de code, duplication de séance, minuteur avec sonnerie, ajout de média par fichier ou lien, onglets du match). Avant de coder un écran, relire sa maquette. Ces fichiers sont des références visuelles écrites dans un format de maquette : ne pas les copier tels quels, les retranscrire en composants React + Tailwind.

## Lot 1 (à construire en premier)

1. **Connexion par code** + gestion des membres et des rôles par l'admin.
2. **Équipes** : fiche équipe (catégorie, effectif, staff, créneaux d'entraînement, gymnase).
3. **Séances** :
    - Bibliothèque d'exercices du club : titre, partie de séance, durée par défaut, consignes, tags, média.
    - Média : photo ou vidéo importée depuis le téléphone (photos compressées côté client ; vidéos limitées en durée et en poids), OU lien YouTube, Instagram, TikTok, Facebook, X, Vimeo avec détection automatique de la plateforme. Lecture intégrée quand la plateforme le permet, sinon ouverture dans l'app concernée. Privilégier les liens pour rester sous 1 Go de stockage.
    - Création de séance : ajouter des exercices depuis la bibliothèque, réordonner par glisser-déposer, durée par bloc, barre de répartition sur la durée totale.
    - Duplication d'une séance vers une ou plusieurs autres équipes (prochain créneau de chacune).
    - Modèles de séance réutilisables.
4. **Mode terrain** :
    - Plein écran sombre, gros texte, exercice par exercice (précédent / suivant), média de l'exercice, consignes.
    - Minuteur par exercice : à la fin, sonnerie en boucle façon minuteur iPhone (Web Audio API) + vibration, écran « Temps écoulé » avec « Arrêter » et « Arrêter et passer à la suite ». Les 10 dernières secondes changent de couleur.
    - Garder l'écran allumé (Wake Lock API) pendant la séance.
    - Appel rapide : une touche par joueur.
5. **Matchs** : import du calendrier depuis l'export FFBB (fichier chargé par l'admin), convocations, confirmation des joueurs, missions bénévoles du match, saisie du résultat et note privée du coach.
6. **Accueil** par rôle : séance du jour, séances de la semaine à préparer, prochain match, actions en attente.

## Lots suivants

- Lot 2 : saison (calendrier, cycles, périodisation, vacances scolaires zone B), joueurs (fiche, présences, questionnaires bien-être, progression), bénévoles.
- Lot 3 : projet club (objectifs, actions, responsables, échéances), communication (annonces, notifications push).

## Données des mineurs (RGPD)

- Accord parental recueilli à la première connexion (case à cocher datée et enregistrée) pour les moins de 18 ans.
- Questionnaires bien-être et douleurs = données de santé : visibles uniquement par les entraîneurs de l'équipe et l'admin.
- Suppression des données de santé en fin de saison ou au départ du joueur.

## Contraintes offre gratuite

- Supabase gratuit : 500 Mo de base, 1 Go de fichiers, 5 Go de bande passante par mois. Surveiller le stockage.
- Un projet Supabase gratuit se met en pause après 7 jours sans activité : prévoir une tâche planifiée (cron Vercel) qui fait une requête légère chaque jour.
- Ne rien mettre en place qui impose un abonnement payant.

## Façon de travailler

- Avancer par petites étapes testables ; montrer le résultat à chaque étape.
- Migrations SQL versionnées dans le dépôt (`supabase/migrations`).
- Données de démonstration (une équipe U15, quelques joueurs fictifs, quelques exercices) pour tester sans données réelles.
- Avant de déployer : vérifier sur téléphone (largeur 390 px) et sur ordinateur.
- Ne jamais committer de secrets : variables d'environnement uniquement.
