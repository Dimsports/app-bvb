import * as XLSX from "xlsx";
import { ROLES, type Role } from "./roles";
import { categorieFromBirthdate, teamLabel } from "@/lib/teams/constants";
import type { Team } from "@/lib/teams/queries";

export const TARGET_FIELDS = [
  "nom",
  "prenom",
  "dateNaissance",
  "roles",
  "equipe",
  "compteParent",
  "telephoneParent",
] as const;
export type TargetField = (typeof TARGET_FIELDS)[number];

export const TARGET_FIELD_LABELS: Record<TargetField, string> = {
  nom: "Nom",
  prenom: "Prénom",
  dateNaissance: "Date de naissance",
  roles: "Rôle(s)",
  equipe: "Équipe",
  compteParent: "Compte tenu par un parent",
  telephoneParent: "Téléphone parent",
};

const HEADER_HINTS: Record<TargetField, string[]> = {
  nom: ["nom"],
  prenom: ["prenom"],
  dateNaissance: ["date de naissance", "ne le", "date naissance", "naissance"],
  roles: ["role", "fonction"],
  equipe: ["equipe", "team", "categorie"],
  compteParent: ["parent"],
  telephoneParent: ["telephone", "tel parent", "tel."],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export type ParsedFile = {
  headers: string[];
  rows: string[][];
};

export function parseImportFile(data: ArrayBuffer, isCsv: boolean): ParsedFile {
  // Un CSV n'a pas d'encodage déclaré : XLSX.read sur un ArrayBuffer brut
  // interprète mal les accents (UTF-8 lu comme Latin-1). On décode donc
  // explicitement le texte en UTF-8 avant de le passer au parseur.
  const workbook = isCsv
    ? XLSX.read(new TextDecoder("utf-8").decode(data), { type: "string" })
    : XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
  if (matrix.length === 0) return { headers: [], rows: [] };

  const headers = matrix[0].map((h) => String(h ?? "").trim());
  const rows = matrix
    .slice(1)
    .filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""))
    .map((r) => headers.map((_, i) => String(r[i] ?? "").trim()));

  return { headers, rows };
}

export function autoMapColumns(headers: string[]): Partial<Record<TargetField, number>> {
  const normalized = headers.map(normalizeHeader);
  const used = new Set<number>();
  const mapping: Partial<Record<TargetField, number>> = {};

  for (const field of TARGET_FIELDS) {
    const hints = HEADER_HINTS[field];
    const idx = normalized.findIndex((h, i) => !used.has(i) && hints.some((hint) => h.includes(hint)));
    if (idx !== -1) {
      mapping[field] = idx;
      used.add(idx);
    }
  }

  return mapping;
}

function parseDateFlexible(value: string): string | null {
  const v = value.trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = v.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

const IMPORTABLE_ROLES = ROLES.filter((r) => r !== "admin");

function parseRoles(value: string): Role[] {
  if (!value) return [];
  const parts = value
    .split(/[,;/+]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const mapped = new Set<Role>();
  for (const p of parts) {
    if (p.startsWith("entrain")) mapped.add("entraineur");
    else if (p.startsWith("coach")) mapped.add("coach");
    else if (p.startsWith("jou")) mapped.add("joueur");
    else if (p.startsWith("benevol") || p.startsWith("bénévol")) mapped.add("benevole");
  }
  return [...mapped].filter((r) => (IMPORTABLE_ROLES as readonly Role[]).includes(r));
}

function resolveTeam(
  equipeRaw: string,
  dateNaissance: string | null,
  teams: Team[]
): { teamId: string | null; suggested: boolean } {
  const raw = equipeRaw.trim().toLowerCase();
  if (raw) {
    const match = teams.find((t) => {
      const label = teamLabel(t).toLowerCase();
      return label === raw || label.includes(raw) || t.categorie.toLowerCase() === raw;
    });
    if (match) return { teamId: match.id, suggested: false };
  }

  if (dateNaissance) {
    const categorie = categorieFromBirthdate(dateNaissance);
    if (categorie) {
      const match = teams.find((t) => t.categorie === categorie);
      if (match) return { teamId: match.id, suggested: true };
    }
  }

  return { teamId: null, suggested: false };
}

function compteParentFromRaw(value: string): boolean {
  return /^(oui|yes|true|1|o)$/i.test(value.trim());
}

function dupKey(prenom: string, nom: string): string {
  return `${prenom.trim().toLowerCase()}|${nom.trim().toLowerCase()}`;
}

export type PreviewRow = {
  rowIndex: number;
  nom: string;
  prenom: string;
  dateNaissanceRaw: string;
  dateNaissance: string | null;
  dateInvalid: boolean;
  rolesRaw: string;
  roles: Role[];
  equipeRaw: string;
  teamId: string | null;
  teamSuggested: boolean;
  compteParent: boolean;
  telephoneParent: string;
  errors: string[];
  warnings: string[];
  duplicateInFile: boolean;
  duplicateInDb: boolean;
};

export function interpretRows(
  rawRows: string[][],
  mapping: Partial<Record<TargetField, number>>,
  teams: Team[],
  existingMembers: { prenom: string; nom: string }[]
): PreviewRow[] {
  const seen = new Set<string>();
  const existingKeys = new Set(existingMembers.map((m) => dupKey(m.prenom, m.nom)));

  return rawRows.map((raw, rowIndex) => {
    const get = (field: TargetField) => {
      const idx = mapping[field];
      return idx !== undefined ? (raw[idx] ?? "").trim() : "";
    };

    const nom = get("nom");
    const prenom = get("prenom");
    const dateNaissanceRaw = get("dateNaissance");
    const dateNaissance = dateNaissanceRaw ? parseDateFlexible(dateNaissanceRaw) : null;
    const dateInvalid = Boolean(dateNaissanceRaw) && !dateNaissance;
    const rolesRaw = get("roles");
    const roles = parseRoles(rolesRaw);
    const equipeRaw = get("equipe");
    const { teamId, suggested: teamSuggested } = resolveTeam(equipeRaw, dateNaissance, teams);
    const compteParent = compteParentFromRaw(get("compteParent"));
    const telephoneParent = get("telephoneParent");

    const errors: string[] = [];
    if (!nom) errors.push("Nom manquant");
    if (!prenom) errors.push("Prénom manquant");
    if (roles.length === 0) errors.push("Rôle manquant ou invalide");

    const warnings: string[] = [];
    if (dateInvalid) warnings.push("Date de naissance invalide");
    if (equipeRaw && !teamId) warnings.push("Équipe inconnue");

    const key = nom && prenom ? dupKey(prenom, nom) : null;
    let duplicateInFile = false;
    if (key) {
      if (seen.has(key)) duplicateInFile = true;
      else seen.add(key);
    }
    const duplicateInDb = key ? existingKeys.has(key) : false;

    return {
      rowIndex,
      nom,
      prenom,
      dateNaissanceRaw,
      dateNaissance,
      dateInvalid,
      rolesRaw,
      roles,
      equipeRaw,
      teamId,
      teamSuggested,
      compteParent,
      telephoneParent,
      errors,
      warnings,
      duplicateInFile,
      duplicateInDb,
    };
  });
}
