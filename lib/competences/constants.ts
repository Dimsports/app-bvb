export const NIVEAUX = ["non_acquis", "en_cours", "acquis", "maitrise"] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const NIVEAU_LABELS: Record<Niveau, string> = {
  non_acquis: "Non acquis",
  en_cours: "En cours",
  acquis: "Acquis",
  maitrise: "Maîtrisé",
};

// Correspond aux tokens --color-niveau-* de app/globals.css
export const NIVEAU_COLOR_VAR: Record<Niveau, string> = {
  non_acquis: "var(--color-niveau-non-acquis)",
  en_cours: "var(--color-niveau-en-cours)",
  acquis: "var(--color-niveau-acquis)",
  maitrise: "var(--color-niveau-maitrise)",
};

export const NIVEAU_ORDER: Record<Niveau, number> = {
  non_acquis: 0,
  en_cours: 1,
  acquis: 2,
  maitrise: 3,
};

export function isNiveau(value: string): value is Niveau {
  return (NIVEAUX as readonly string[]).includes(value);
}
