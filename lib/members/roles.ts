export const ROLES = ["admin", "entraineur", "coach", "joueur", "benevole"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  entraineur: "Entraineur",
  coach: "Coach",
  joueur: "Joueur",
  benevole: "Bénévole",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function rolesSummary(roles: string[]): string {
  return roles
    .filter(isRole)
    .map((role) => ROLE_LABELS[role])
    .join(" · ");
}

export function initials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}
