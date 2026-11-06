export const PARTIES = ["echauffement", "fondamentaux", "theme", "jeu", "retour_calme"] as const;
export type Partie = (typeof PARTIES)[number];

export const PARTIE_LABELS: Record<Partie, string> = {
  echauffement: "Échauffement",
  fondamentaux: "Fondamentaux",
  theme: "Thème",
  jeu: "Jeu",
  retour_calme: "Retour au calme",
};

// Correspond aux tokens --color-part-* de app/globals.css
export const PARTIE_COLOR_VAR: Record<Partie, string> = {
  echauffement: "var(--color-part-echauffement)",
  fondamentaux: "var(--color-part-fondamentaux)",
  theme: "var(--color-part-theme)",
  jeu: "var(--color-part-jeu)",
  retour_calme: "var(--color-part-retour-calme)",
};

export function isPartie(value: string): value is Partie {
  return (PARTIES as readonly string[]).includes(value);
}

const NOUVEAU_BADGE_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export function isRecentExercise(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < NOUVEAU_BADGE_DURATION_MS;
}

export const ESPACES = ["demi_terrain", "tout_terrain", "atelier"] as const;
export type Espace = (typeof ESPACES)[number];

export const ESPACE_LABELS: Record<Espace, string> = {
  demi_terrain: "Demi-terrain",
  tout_terrain: "Tout terrain",
  atelier: "Atelier",
};

export function isEspace(value: string): value is Espace {
  return (ESPACES as readonly string[]).includes(value);
}

export const INTENSITES = ["faible", "moyenne", "forte"] as const;
export type Intensite = (typeof INTENSITES)[number];

export const INTENSITE_LABELS: Record<Intensite, string> = {
  faible: "Faible",
  moyenne: "Moyenne",
  forte: "Forte",
};

export function isIntensite(value: string): value is Intensite {
  return (INTENSITES as readonly string[]).includes(value);
}

export const OPPOSITIONS = ["sans", "partielle", "totale"] as const;
export type Opposition = (typeof OPPOSITIONS)[number];

export const OPPOSITION_LABELS: Record<Opposition, string> = {
  sans: "Sans opposition",
  partielle: "Opposition partielle",
  totale: "Opposition totale",
};

export function isOpposition(value: string): value is Opposition {
  return (OPPOSITIONS as readonly string[]).includes(value);
}

export const MAX_PHOTO_DIMENSION = 1600;
export const PHOTO_JPEG_QUALITY = 0.75;
export const MAX_VIDEO_DURATION_SECONDS = 90;
export const MAX_VIDEO_SIZE_BYTES = 40 * 1024 * 1024; // 40 Mo
