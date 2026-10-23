"use client";

import { useEffect, useState, useTransition } from "react";
import { PARTIE_LABELS, isPartie } from "@/lib/exercises/constants";
import type { Exercise } from "@/lib/exercises/queries";
import type { SeanceBloc } from "@/lib/seances/queries";
import { searchExercisesForSeance, addBloc } from "../actions";

export function AddExercisePanel({
  seanceId,
  onAdded,
}: {
  seanceId: string;
  onAdded: (bloc: SeanceBloc) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [isPending, startTransition] = useTransition();

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchExercisesForSeance(trimmed));
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [trimmed]);

  const visibleResults = trimmed.length < 2 ? [] : results;

  function handleAdd(exercise: Exercise) {
    startTransition(async () => {
      const result = await addBloc(seanceId, exercise.id);
      if (result.ok) {
        onAdded(result.bloc);
        setQuery("");
        setResults([]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ajouter un exercice de la bibliothèque…"
        className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm"
      />
      {isPending && trimmed.length >= 2 && <p className="text-sm text-anthracite/50">Recherche…</p>}
      <div className="flex flex-col gap-2">
        {visibleResults.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => handleAdd(ex)}
            className="flex items-center justify-between rounded-lg border border-turquoise/40 px-3 py-2 text-left text-sm font-medium text-turquoise-contrast"
          >
            <span>{ex.titre}</span>
            <span className="text-xs text-anthracite/50">
              {isPartie(ex.partie) ? PARTIE_LABELS[ex.partie] : ex.partie}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
