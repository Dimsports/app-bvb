"use client";

import { useState, useTransition } from "react";
import type { Cycle } from "@/lib/cycles/queries";
import { createCycle, deleteCycle } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function CyclesSection({
  teamId,
  canEdit,
  initialCycles,
}: {
  teamId: string;
  canEdit: boolean;
  initialCycles: Cycle[];
}) {
  const [cycles, setCycles] = useState(initialCycles);
  const [adding, setAdding] = useState(false);
  const [nom, setNom] = useState("");
  const [dateDebut, setDateDebut] = useState(todayISO());
  const [dateFin, setDateFin] = useState(todayISO());
  const [objectif, setObjectif] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createCycle(teamId, { nom, dateDebut, dateFin, objectif });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCycles((prev) => [
        { id: `local-${crypto.randomUUID()}`, team_id: teamId, nom, date_debut: dateDebut, date_fin: dateFin, objectif: objectif.trim() || null, seances: [] },
        ...prev,
      ]);
      setNom("");
      setObjectif("");
      setAdding(false);
    });
  }

  function handleDelete(cycleId: string) {
    setCycles((prev) => prev.filter((c) => c.id !== cycleId));
    startTransition(() => {
      deleteCycle(teamId, cycleId);
    });
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-title text-xl text-anthracite">Cycles</h2>
        {canEdit && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-sm font-medium text-turquoise-contrast"
          >
            + Ajouter
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg bg-anthracite/5 p-3">
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du cycle (ex. Prise de repères)"
            className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm text-anthracite"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="h-11 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm text-anthracite"
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="h-11 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm text-anthracite"
            />
          </div>
          <textarea
            value={objectif}
            onChange={(e) => setObjectif(e.target.value)}
            placeholder="Objectif (facultatif)"
            rows={2}
            className="rounded-lg border border-anthracite/20 p-3 text-sm text-anthracite"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending || !nom.trim()}
              onClick={handleCreate}
              className="h-10 rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-40"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="h-10 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {cycles.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {cycles.map((c) => (
            <li key={c.id} className="rounded-lg bg-anthracite/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-anthracite">{c.nom}</p>
                  <p className="text-xs text-anthracite/50">
                    {DATE_FORMAT.format(new Date(`${c.date_debut}T00:00:00`))} –{" "}
                    {DATE_FORMAT.format(new Date(`${c.date_fin}T00:00:00`))}
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="shrink-0 text-xs text-anthracite/40 hover:text-anthracite"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              {c.objectif && <p className="mt-1 text-sm text-anthracite/70">{c.objectif}</p>}
              {c.seances.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1">
                  {c.seances.map((s) => (
                    <li key={s.id} className="text-xs text-anthracite/60">
                      {DATE_FORMAT.format(new Date(`${s.date}T00:00:00`))}
                      {s.titre ? ` · ${s.titre}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-anthracite/40">Aucune séance rattachée.</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-anthracite/50">Aucun cycle pour l&apos;instant.</p>
      )}
    </section>
  );
}
