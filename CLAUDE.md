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

## Administration (obligatoire, fait partie du lot 1)

### Premier compte admin
- Page `/installation` accessible uniquement tant qu'aucun admin n'existe en base.
- Elle exige un jeton secret lu dans la variable d'environnement `SETUP_TOKEN` (définie dans Vercel), puis demande prénom, nom et code à 6 chiffres.
- Dès qu'un admin existe, `/installation` renvoie 404 définitivement.
- Un admin peut nommer d'autres admins ; impossible de retirer le rôle admin au dernier admin.

### Espace Administration
Entrée « Administration » visible uniquement pour le rôle admin : dans « Plus » sur téléphone, dans la barre latérale sur ordinateur. Pages :

1. **Membres** : liste avec recherche et filtres (rôle, équipe, catégorie) ; créer, modifier, désactiver un membre ; rôles multiples par case à cocher ; rattachement aux équipes (joueur, entraîneur, coach) ; case « compte tenu par un parent ».
2. **Codes d'accès** : génération automatique à la création, réinitialisation en un clic, déblocage d'un compte bloqué. Le nouveau code s'affiche une seule fois. Fiche d'accès imprimable par membre ou par équipe (nom, code, QR code vers l'app).
3. **Import des licenciés** : import d'un fichier CSV/Excel (export FFBB) avec aperçu avant validation, détection des doublons, création des comptes et des codes en lot.
4. **Équipes** : créer, modifier, archiver ; catégorie, saison, gymnase, créneaux, staff.
5. **Fonctionnalités** : activer ou désactiver chaque module (Séances, Mode terrain, Matchs, Saison, Joueurs, Questionnaires, Bénévoles, Projet club, Communication) pour tout le club, et choisir quels rôles y ont accès. Un module désactivé disparaît de la navigation et ses routes sont refusées côté serveur.
6. **Réglages du club** : nom, logo, saison en cours (dates), gymnases, catégories d'âge.
7. **Journal** : dernières actions sensibles (création de membre, changement de rôle, réinitialisation de code, import).

### Règles
- Chaque action d'administration est vérifiée côté serveur (rôle admin), jamais seulement en masquant un bouton.
- Les permissions par module sont stockées en base (table `club_features`) et lues par le middleware et par la navigation.

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

## Retours du 5 novembre 2026 (PRIORITAIRES, à faire avant le reste)

### 1. Bouton retour
- Sur toutes les pages sauf les 5 onglets principaux : bouton retour (flèche, 44 px) en haut à gauche de l'en-tête, comme dans les maquettes `Seance.html` et `Match.html`.
- Il revient à la page précédente ; si l'utilisateur est arrivé directement par un lien, il revient à la page parente logique (ex. fiche joueur → équipe → liste des équipes).
- Titre de la page à côté du bouton, pour toujours savoir où l'on est.

### 2. Création de comptes par fichier
- Dans Administration › Import des licenciés : bouton « Importer un fichier » (CSV, XLSX), et bouton « Télécharger le modèle » qui fournit un fichier vide avec les bonnes colonnes.
- Colonnes du modèle : Nom, Prénom, Date de naissance, Rôle(s), Équipe, Compte tenu par un parent (oui/non), Téléphone parent (facultatif).
- Accepter aussi l'export FFBB : faire correspondre ses colonnes automatiquement, et laisser l'admin corriger la correspondance.
- Étapes : choix du fichier → aperçu en tableau avec erreurs surlignées (équipe inconnue, doublon, date invalide) → validation → création en lot → fiche des codes imprimable pour toutes les personnes créées.
- Si la colonne Équipe est vide, proposer l'équipe selon la catégorie d'âge déduite de la date de naissance.

### 3. Modifier les fonctionnalités d'un membre
- Sur la fiche d'un membre (Administration › Membres) : section « Accès » listant chaque module avec un interrupteur.
- Par défaut, les accès viennent du rôle ; l'admin peut ajouter ou retirer un module pour cette personne seulement (ex. donner « Bibliothèque » à un bénévole, retirer « Matchs » à un coach).
- Stockage : table `member_feature_overrides` (membre, module, autorisé oui/non). Accès final = module activé pour le club ET (droit du rôle, modifié par l'exception individuelle). Vérifié côté serveur.
- Afficher clairement « par défaut (rôle) » ou « personnalisé » à côté de chaque interrupteur, et un bouton « Revenir aux accès du rôle ».

### 4. BVB Book et Compétences (nouveau module, fait partie du lot 1)
**BVB Book** = le référentiel de formation du club : pour chaque catégorie (U9, U11, U13, U15, U17, U18), la liste des compétences attendues, regroupées par domaine. Il reprend les « Projets de jeu » par catégorie.
- Domaines : Fondamentaux offensifs, Fondamentaux défensifs, Jeu collectif, Physique et motricité, Mental et comportement.
- Chaque compétence : intitulé, domaine, catégorie(s), description courte, critères de réussite observables, média facultatif (photo, vidéo ou lien), exercices de la bibliothèque associés.
- Admin et entraîneurs modifient le BVB Book ; les coachs le consultent.

**Évaluation des joueurs**
- Depuis la fiche équipe : « Évaluer » → choisir un ou plusieurs joueurs → la grille des compétences de leur catégorie s'affiche.
- Échelle à 4 niveaux avec couleurs : Non acquis, En cours, Acquis, Maîtrisé. Commentaire facultatif par compétence et commentaire général.
- Évaluation par période (ex. septembre, décembre, mars, juin) pour voir la progression ; chaque évaluation est datée et signée par son auteur.
- Saisie rapide sur téléphone : un joueur par écran, une touche par niveau, passage au joueur suivant.
- Fiche de progression du joueur : niveau par domaine, évolution entre deux périodes, points forts et axes de travail.
- Vue équipe : tableau joueurs × compétences pour repérer ce qu'il faut travailler ; bouton « Trouver des exercices » qui filtre la bibliothèque sur la compétence choisie.

**Confidentialité (non négociable)**
- Évaluations visibles uniquement par le staff : entraîneurs et coachs de l'équipe du joueur, et admin.
- Jamais visibles par le joueur ni par le parent qui tient son compte : ni page, ni lien, ni donnée renvoyée par l'API. Vérifié côté serveur et par RLS, et testé.
- Tables : `competences`, `competence_domains`, `evaluations`, `evaluation_items`.

### 5. Équipe choisie dès la création d'un membre
- Dans le formulaire de création d'un membre : champ « Équipe(s) » avec liste déroulante de recherche.
- Dès que la date de naissance est saisie, l'équipe de la catégorie correspondante est proposée en premier.
- Pour un entraîneur ou un coach : sélection de plusieurs équipes possible, avec son rôle dans chacune.
- La fiche équipe montre immédiatement le nouveau membre.

### 6. Thématiques de la bibliothèque adaptées au basket
Remplacer les thématiques génériques par ce référentiel (modifiable par l'admin dans Réglages) :

| Famille | Thématiques |
| --- | --- |
| Fondamentaux offensifs | Dribble et maniement, Passe et réception, Tir en course / finition, Tir extérieur, Lancer franc, Jeu de pieds et appuis, Arrêts et pivots, 1c1 offensif, Jeu dos au panier, Rebond offensif |
| Fondamentaux défensifs | Défense sur porteur, Défense sur non-porteur, Aide et rotation, Défense poste bas, Rebond défensif et box-out, Contestation de tir |
| Jeu collectif | Jeu sans ballon et démarquage, Spacing, Passe et va / passer-couper, Écrans directs (pick and roll), Écrans indirects, Surnombre (2c1, 3c2), Transition offensive / contre-attaque, Repli défensif, Attaque de zone, Défense de zone, Presse et attaque de presse, Situations spéciales (remise en jeu, fin de match) |
| Physique et motricité | Coordination, Vitesse et réactivité, Changements de direction, Gainage et prévention, Endurance spécifique |
| Mental et comportement | Communication, Concentration, Leadership, Fair-play |

- Filtres supplémentaires sur chaque exercice : catégorie d'âge, partie de séance, nombre de joueurs, espace (demi-terrain, tout terrain, atelier), matériel, intensité, opposition (sans, partielle, totale).
- Un exercice peut avoir plusieurs thématiques et être relié à des compétences du BVB Book.

### 7. Bibliothèque partagée automatiquement
- Quand un entraîneur ou un coach crée un nouvel exercice, y compris directement dans une séance, il est enregistré dans la bibliothèque du club et devient visible par tous les entraîneurs et coachs.
- L'exercice indique son auteur et sa date. Badge « Nouveau » pendant 14 jours.
- Seuls l'auteur et l'admin modifient ou suppriment l'original. Les autres font « Dupliquer et adapter », qui crée leur propre version, aussi partagée.
- Modifier un exercice dans une séance (durée, consignes du jour) ne modifie pas l'exercice de la bibliothèque.
- Supprimer un exercice de la bibliothèque ne le retire pas des séances déjà créées.

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
