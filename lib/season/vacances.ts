// Vacances scolaires zone B (académie de Nantes), année 2026-2027.
// Source : dates officielles communiquées par le club. Pas de table en
// base — ce sont des dates fixes publiées des années à l'avance par le
// ministère. À mettre à jour ici à la prochaine année scolaire.

export type VacancePeriode = {
  nom: string;
  dateDebut: string;
  dateFin: string | null;
};

export const VACANCES_ZONE_B_2026_2027: VacancePeriode[] = [
  { nom: "Vacances de la Toussaint", dateDebut: "2026-10-17", dateFin: "2026-11-02" },
  { nom: "Vacances de Noël", dateDebut: "2026-12-19", dateFin: "2027-01-04" },
  { nom: "Vacances d'hiver", dateDebut: "2027-02-20", dateFin: "2027-03-08" },
  { nom: "Vacances de printemps", dateDebut: "2027-04-17", dateFin: "2027-05-03" },
  { nom: "Pont de l'Ascension", dateDebut: "2027-05-05", dateFin: "2027-05-10" },
  { nom: "Vacances d'été", dateDebut: "2027-07-03", dateFin: null },
];

export function getVacanceForDate(dateISO: string): VacancePeriode | null {
  return (
    VACANCES_ZONE_B_2026_2027.find(
      (v) => dateISO >= v.dateDebut && (v.dateFin === null || dateISO <= v.dateFin)
    ) ?? null
  );
}

export function getRelevantVacance(fromDateISO: string, horizonDays = 21): VacancePeriode | null {
  const current = getVacanceForDate(fromDateISO);
  if (current) return current;

  const next = VACANCES_ZONE_B_2026_2027.find((v) => v.dateDebut > fromDateISO);
  if (!next) return null;

  const daysUntil = Math.round(
    (new Date(`${next.dateDebut}T00:00:00`).getTime() - new Date(`${fromDateISO}T00:00:00`).getTime()) /
      86400000
  );
  return daysUntil <= horizonDays ? next : null;
}
