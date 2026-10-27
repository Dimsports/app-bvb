export const CONVOCATION_STATUTS = ["en_attente", "confirme", "decline"] as const;
export type ConvocationStatut = (typeof CONVOCATION_STATUTS)[number];

export const CONVOCATION_STATUT_LABELS: Record<ConvocationStatut, string> = {
  en_attente: "En attente",
  confirme: "Confirmé",
  decline: "Décliné",
};

export function isConvocationStatut(value: string): value is ConvocationStatut {
  return (CONVOCATION_STATUTS as readonly string[]).includes(value);
}
