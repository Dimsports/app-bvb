export const CATEGORIES = ["U7", "U9", "U11", "U13", "U15", "U17", "U18", "Seniors"] as const;
export type Categorie = (typeof CATEGORIES)[number];

export const GENRES = ["F", "M", "Mixte"] as const;
export type Genre = (typeof GENRES)[number];

export const GENRE_LABELS: Record<Genre, string> = {
  F: "Filles",
  M: "Garçons",
  Mixte: "Mixte",
};

export const JOURS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
] as const;

export function jourLabel(jour: number): string {
  return JOURS.find((j) => j.value === jour)?.label ?? "?";
}

export function teamLabel(team: { categorie: string; genre: string; nom: string | null }): string {
  if (team.nom) return team.nom;
  const genreSuffix = team.genre === "Mixte" ? "" : ` ${GENRE_LABELS[team.genre as Genre]}`;
  return `${team.categorie}${genreSuffix}`;
}

/**
 * Catégorie d'âge proposée à partir de la date de naissance (saison
 * FFBB démarrant en septembre, âge au 31 décembre de la saison en
 * cours). Approximation volontaire : sert uniquement à proposer une
 * équipe en premier dans le formulaire, l'admin choisit librement.
 */
export function categorieFromBirthdate(dateNaissance: string): Categorie | null {
  const birth = new Date(`${dateNaissance}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  const seasonRefYear = today.getMonth() >= 8 ? today.getFullYear() + 1 : today.getFullYear();
  const age = seasonRefYear - birth.getFullYear();

  if (age <= 7) return "U7";
  if (age <= 9) return "U9";
  if (age <= 11) return "U11";
  if (age <= 13) return "U13";
  if (age <= 15) return "U15";
  if (age <= 17) return "U17";
  if (age <= 18) return "U18";
  return "Seniors";
}
