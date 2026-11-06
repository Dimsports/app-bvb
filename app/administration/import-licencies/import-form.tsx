"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { teamLabel } from "@/lib/teams/constants";
import type { Team } from "@/lib/teams/queries";
import {
  TARGET_FIELDS,
  TARGET_FIELD_LABELS,
  autoMapColumns,
  interpretRows,
  type TargetField,
  type PreviewRow,
} from "@/lib/members/import-parse";
import { ROLE_LABELS, type Role } from "@/lib/members/roles";
import { previewImportFile, confirmImportRows, type ImportResultRow } from "./actions";

const TEMPLATE_HEADERS = [
  "Nom",
  "Prénom",
  "Date de naissance",
  "Rôle(s)",
  "Équipe",
  "Compte tenu par un parent (oui/non)",
  "Téléphone parent",
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Licenciés");
  XLSX.writeFile(wb, "modele-import-licencies.xlsx");
}

export function ImportForm({
  teams,
  existingMembers,
}: {
  teams: Team[];
  existingMembers: { prenom: string; nom: string }[];
}) {
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<TargetField, number>>>({});
  const [teamOverrides, setTeamOverrides] = useState<Record<number, string>>({});
  const [includeOverrides, setIncludeOverrides] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ImportResultRow[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewRows = useMemo<PreviewRow[]>(
    () => (headers ? interpretRows(rawRows, mapping, teams, existingMembers) : []),
    [headers, rawRows, mapping, teams, existingMembers]
  );

  function resolvedTeamId(row: PreviewRow): string | null {
    if (row.rowIndex in teamOverrides) return teamOverrides[row.rowIndex] || null;
    return row.teamId;
  }

  function isIncluded(row: PreviewRow): boolean {
    if (row.errors.length > 0) return false;
    if (row.rowIndex in includeOverrides) return includeOverrides[row.rowIndex];
    return !row.duplicateInFile && !row.duplicateInDb;
  }

  const includedCount = previewRows.filter(isIncluded).length;

  function reset() {
    setHeaders(null);
    setRawRows([]);
    setMapping({});
    setTeamOverrides({});
    setIncludeOverrides({});
    setError(null);
    setCreated(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setCreated(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await previewImportFile(formData);
      if (!result.ok) {
        setError(result.error);
        setHeaders(null);
        return;
      }
      setHeaders(result.headers);
      setRawRows(result.rows);
      setMapping(autoMapColumns(result.headers));
      setTeamOverrides({});
      setIncludeOverrides({});
    });
  }

  function handleConfirm() {
    const toCreate = previewRows.filter(isIncluded).map((row) => ({
      nom: row.nom,
      prenom: row.prenom,
      roles: row.roles,
      dateNaissance: row.dateNaissance,
      teamId: resolvedTeamId(row),
      compteParent: row.compteParent,
      telephoneParent: row.telephoneParent,
    }));

    if (toCreate.length === 0) return;

    setError(null);
    startTransition(async () => {
      const result = await confirmImportRows(toCreate);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated(result.created);
    });
  }

  if (created) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="font-title text-xl text-anthracite">
          {created.length} membre{created.length > 1 ? "s" : ""} créé{created.length > 1 ? "s" : ""}
        </h2>
        <p className="mt-1 text-sm text-anthracite/60">
          Notez ou imprimez ces codes maintenant : ils ne seront plus jamais affichés.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {created.map((m) => (
            <li
              key={`${m.prenom}-${m.nom}-${m.code}`}
              className="flex items-center justify-between rounded-xl border border-anthracite/10 p-3"
            >
              <div>
                <p className="font-medium text-anthracite">
                  {m.prenom} {m.nom}
                </p>
                <p className="text-xs text-anthracite/50">
                  {m.roles.map((r) => (r in ROLE_LABELS ? ROLE_LABELS[r as Role] : r)).join(" · ")}
                </p>
              </div>
              <p className="font-title text-xl tracking-widest text-turquoise-contrast">{m.code}</p>
            </li>
          ))}
        </ul>

        <div className="print:hidden mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-12 flex-1 rounded-xl bg-anthracite font-medium text-white"
          >
            Imprimer la fiche des codes
          </button>
          <button
            type="button"
            onClick={reset}
            className="h-12 rounded-xl border border-anthracite/20 px-4 font-medium text-anthracite"
          >
            Nouvel import
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Importer un fichier</h2>
      <p className="mt-1 text-sm text-anthracite/60">
        Fichier CSV ou Excel (export FFBB accepté) avec une ligne par personne.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          className="h-12 rounded-xl bg-anthracite px-5 font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Lecture…" : "Importer un fichier"}
        </button>
        <button
          type="button"
          onClick={downloadTemplate}
          className="h-12 rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
        >
          Télécharger le modèle
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {headers && (
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-medium text-anthracite/70">Correspondance des colonnes</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TARGET_FIELDS.map((field) => (
                <label key={field} className="flex flex-col gap-1">
                  <span className="text-xs text-anthracite/60">{TARGET_FIELD_LABELS[field]}</span>
                  <select
                    value={mapping[field] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field]: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                    className="h-11 rounded-lg border border-anthracite/20 px-2 text-sm"
                  >
                    <option value="">— Aucune colonne —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <p className="text-sm text-anthracite/60">
              {previewRows.length} ligne{previewRows.length > 1 ? "s" : ""} · {includedCount} à créer
            </p>

            <ul className="mt-2 flex flex-col gap-2">
              {previewRows.map((row) => {
                const included = isIncluded(row);
                const blocked = row.errors.length > 0;
                const softIssue = row.duplicateInFile || row.duplicateInDb;

                return (
                  <li
                    key={row.rowIndex}
                    className={`rounded-xl border p-3 ${
                      blocked ? "border-red-200 bg-red-50" : softIssue ? "border-amber-200 bg-amber-50" : "border-anthracite/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={included}
                        disabled={blocked}
                        onChange={(e) =>
                          setIncludeOverrides((prev) => ({ ...prev, [row.rowIndex]: e.target.checked }))
                        }
                        className="mt-1 h-5 w-5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-anthracite">
                          {row.prenom || <span className="text-red-600">—</span>}{" "}
                          {row.nom || <span className="text-red-600">—</span>}
                        </p>
                        <p className="text-xs text-anthracite/50">
                          {row.roles.length > 0
                            ? row.roles.map((r) => ROLE_LABELS[r]).join(" · ")
                            : row.rolesRaw || "Aucun rôle"}
                          {row.dateNaissance ? ` · ${row.dateNaissance}` : ""}
                          {row.telephoneParent ? ` · Tél. parent ${row.telephoneParent}` : ""}
                          {row.compteParent ? " · Compte tenu par un parent" : ""}
                        </p>

                        {(row.roles.includes("joueur") ||
                          row.roles.includes("entraineur") ||
                          row.roles.includes("coach")) && (
                          <select
                            value={resolvedTeamId(row) ?? ""}
                            onChange={(e) =>
                              setTeamOverrides((prev) => ({ ...prev, [row.rowIndex]: e.target.value }))
                            }
                            className="mt-2 h-10 w-full max-w-xs rounded-lg border border-anthracite/20 px-2 text-sm"
                          >
                            <option value="">Aucune équipe</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {teamLabel(t)}
                                {row.teamSuggested && row.teamId === t.id ? " (proposée)" : ""}
                              </option>
                            ))}
                          </select>
                        )}

                        {(row.errors.length > 0 || row.warnings.length > 0 || softIssue) && (
                          <p className="mt-1 text-xs font-medium text-red-700">
                            {[
                              ...row.errors,
                              ...row.warnings,
                              row.duplicateInFile ? "Doublon dans le fichier" : null,
                              row.duplicateInDb ? "Existe déjà dans le club" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            type="button"
            disabled={includedCount === 0 || isPending}
            onClick={handleConfirm}
            className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-40"
          >
            {isPending ? "Création…" : `Créer ${includedCount} membre${includedCount > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </section>
  );
}
