"use client";

import { useEffect, useState, useTransition } from "react";
import type { Exercise } from "@/lib/exercises/queries";
import { searchExercisesForCompetence } from "./actions";

export function ExercisePicker({
  selected,
  onChange,
}: {
  selected: { id: string; titre: string }[];
  onChange: (exercises: { id: string; titre: string }[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [, startTransition] = useTransition();

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchExercisesForCompetence(trimmed);
        setResults(found.filter((ex) => !selected.some((s) => s.id === ex.id)));
      });
    }, 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  const visibleResults = trimmed.length < 2 ? [] : results;

  function add(ex: Exercise) {
    onChange([...selected, { id: ex.id, titre: ex.titre }]);
    setQuery("");
    setResults([]);
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((ex) => (
          <span
            key={ex.id}
            className="flex items-center gap-1 rounded-full bg-turquoise/15 px-3 py-1 text-sm text-turquoise-contrast"
          >
            {ex.titre}
            <button type="button" onClick={() => remove(ex.id)} className="font-bold">
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un exercice de la bibliothèque…"
        className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm"
      />
      {visibleResults.length > 0 && (
        <div className="flex flex-col gap-1">
          {visibleResults.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => add(ex)}
              className="rounded-lg border border-anthracite/20 px-3 py-2 text-left text-sm text-anthracite"
            >
              + {ex.titre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
