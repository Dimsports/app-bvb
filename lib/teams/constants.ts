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
