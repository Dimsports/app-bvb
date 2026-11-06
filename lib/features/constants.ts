export const MODULES = [
  "seances",
  "mode_terrain",
  "matchs",
  "saison",
  "joueurs",
  "questionnaires",
  "benevoles",
  "projet_club",
  "communication",
] as const;

export type Module = (typeof MODULES)[number];

export const MODULE_LABELS: Record<Module, string> = {
  seances: "Séances",
  mode_terrain: "Mode terrain",
  matchs: "Matchs",
  saison: "Saison",
  joueurs: "Joueurs",
  questionnaires: "Questionnaires",
  benevoles: "Bénévoles",
  projet_club: "Projet club",
  communication: "Communication",
};

export function isModule(value: string): value is Module {
  return (MODULES as readonly string[]).includes(value);
}

export type ClubFeature = {
  module: Module;
  enabled: boolean;
  roles: string[];
};
