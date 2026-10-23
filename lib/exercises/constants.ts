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

export const MAX_PHOTO_DIMENSION = 1600;
export const PHOTO_JPEG_QUALITY = 0.75;
export const MAX_VIDEO_DURATION_SECONDS = 90;
export const MAX_VIDEO_SIZE_BYTES = 40 * 1024 * 1024; // 40 Mo
