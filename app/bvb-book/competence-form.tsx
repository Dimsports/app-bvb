"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ThemeFamily } from "@/lib/themes/queries";
import { ExercisePicker } from "./exercise-picker";
import { createCompetence, updateCompetence, type CompetenceInput } from "./actions";

export function CompetenceForm({
  mode,
  competenceId,
  domains,
  clubCategories,
  initial,
}: {
  mode: "create" | "edit";
  competenceId?: string;
  domains: ThemeFamily[];
  clubCategories: string[];
  initial?: {
    nom: string;
    domainId: string;
    categories: string[];
    description: string;
    criteres: string;
    exercises: { id: string; titre: string }[];
  };
}) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [domainId, setDomainId] = useState(initial?.domainId ?? domains[0]?.id ?? "");
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [criteres, setCriteres] = useState(initial?.criteres ?? "");
  const [exercises, setExercises] = useState(initial?.exercises ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggleCategorie(cat: string) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const input: CompetenceInput = {
      nom,
      domainId,
      categories,
      description,
      criteres,
      exerciseIds: exercises.map((ex) => ex.id),
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createCompetence(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/bvb-book/${result.id}`);
      } else {
        const result = await updateCompetence(competenceId!, input);
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
        <span className="text-sm text-anthracite/60">Intitulé</span>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Domaine</span>
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
          required
        >
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>
      </label>

      {clubCategories.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-anthracite/60">Catégorie(s) d&apos;âge</span>
          <div className="flex flex-wrap gap-2">
            {clubCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategorie(cat)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  categories.includes(cat)
                    ? "border-turquoise bg-turquoise text-white"
                    : "border-anthracite/20 text-anthracite"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Description courte</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-lg border border-anthracite/20 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Critères de réussite observables</span>
        <textarea
          value={criteres}
          onChange={(e) => setCriteres(e.target.value)}
          rows={4}
          placeholder="Un critère par ligne"
          className="rounded-lg border border-anthracite/20 px-3 py-2"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Exercices de la bibliothèque associés</span>
        <ExercisePicker selected={exercises} onChange={setExercises} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-turquoise-contrast">Enregistré.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : mode === "create" ? "Créer la compétence" : "Enregistrer"}
      </button>
    </form>
  );
}
