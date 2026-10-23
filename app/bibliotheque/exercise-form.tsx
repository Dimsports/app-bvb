"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PARTIES, PARTIE_LABELS, type Partie } from "@/lib/exercises/constants";
import { TagInput } from "./tag-input";
import { createExercise, updateExercise, type ExerciseInput } from "./actions";

export function ExerciseForm({
  mode,
  exerciseId,
  initial,
}: {
  mode: "create" | "edit";
  exerciseId?: string;
  initial?: {
    titre: string;
    partie: string;
    dureeDefautMinutes: string;
    consignes: string;
    tags: string[];
  };
}) {
  const [titre, setTitre] = useState(initial?.titre ?? "");
  const [partie, setPartie] = useState<Partie>((initial?.partie as Partie) ?? "theme");
  const [duree, setDuree] = useState(initial?.dureeDefautMinutes ?? "");
  const [consignes, setConsignes] = useState(initial?.consignes ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const input: ExerciseInput = { titre, partie, dureeDefautMinutes: duree, consignes, tags };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createExercise(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/bibliotheque/${result.id}`);
      } else {
        const result = await updateExercise(exerciseId!, input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Titre</span>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
          required
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Partie de séance</span>
          <select
            value={partie}
            onChange={(e) => setPartie(e.target.value as Partie)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          >
            {PARTIES.map((p) => (
              <option key={p} value={p}>
                {PARTIE_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-32 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Durée (min)</span>
          <input
            type="number"
            min={1}
            max={180}
            value={duree}
            onChange={(e) => setDuree(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Consignes</span>
        <textarea
          value={consignes}
          onChange={(e) => setConsignes(e.target.value)}
          rows={4}
          className="rounded-lg border border-anthracite/20 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Tags</span>
        <TagInput tags={tags} onChange={setTags} />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-turquoise-contrast">Enregistré.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : mode === "create" ? "Créer l'exercice" : "Enregistrer"}
      </button>
    </form>
  );
}
