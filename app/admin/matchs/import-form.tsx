"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { teamLabel } from "@/lib/teams/constants";
import type { Team } from "@/lib/teams/queries";
import type { ParsedMatchRow } from "@/lib/matches/parse";
import { previewImport, confirmImport } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });

export function ImportForm({ teams }: { teams: Team[] }) {
  const [rows, setRows] = useState<ParsedMatchRow[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allMapped = useMemo(
    () => rows !== null && rows.every((r) => mapping[r.equipeBvbLabel]),
    [rows, mapping]
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await previewImport(formData);
      if (!result.ok) {
        setError(result.error);
        setRows(null);
        return;
      }
      setRows(result.rows);
      setSkipped(result.skipped);
      setMapping({});
    });
  }

  function handleMap(label: string, teamId: string) {
    setMapping((prev) => ({ ...prev, [label]: teamId }));
  }

  function handleConfirm() {
    if (!rows) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmImport(
        rows.map((r) => ({ ...r, teamId: mapping[r.equipeBvbLabel] }))
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`${result.count} rencontre(s) importée(s).`);
      setRows(null);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Importer un calendrier FFBB</h2>
      <p className="mt-1 text-sm text-anthracite/60">
        Fichier exporté depuis la recherche de rencontres FFBB (.xlsx).
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
        className="mt-4 h-12 rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite disabled:opacity-60"
      >
        {isPending ? "Lecture…" : "Choisir un fichier"}
      </button>
      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-turquoise-contrast">{success}</p>}

      {rows && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-anthracite/60">
            {rows.length} rencontre{rows.length > 1 ? "s" : ""} trouvée{rows.length > 1 ? "s" : ""}
            {skipped > 0 ? ` · ${skipped} ligne(s) ignorée(s) (hors club)` : ""}
          </p>

          {rows.map((row) => (
            <div key={row.numero} className="rounded-xl border border-anthracite/10 p-3">
              <p className="text-sm font-medium text-anthracite">
                {DATE_FORMAT.format(new Date(`${row.date}T00:00:00`))}
                {row.heure ? ` · ${row.heure}` : ""} — {row.domicile ? "vs" : "@"} {row.adversaire}
              </p>
              <p className="text-xs text-anthracite/50">
                {row.equipeBvbLabel}
                {row.division ? ` · ${row.division}` : ""}
                {row.salle ? ` · ${row.salle}` : ""}
              </p>
              <select
                value={mapping[row.equipeBvbLabel] ?? ""}
                onChange={(e) => handleMap(row.equipeBvbLabel, e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-anthracite/20 px-2 text-sm"
              >
                <option value="" disabled>
                  Associer à une équipe…
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {teamLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button
            type="button"
            disabled={!allMapped || isPending}
            onClick={handleConfirm}
            className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-40"
          >
            Confirmer l&apos;import ({rows.length})
          </button>
        </div>
      )}
    </section>
  );
}
