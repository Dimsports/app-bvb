"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PARTIES,
  PARTIE_LABELS,
  ESPACES,
  ESPACE_LABELS,
  INTENSITES,
  INTENSITE_LABELS,
  OPPOSITIONS,
  OPPOSITION_LABELS,
  type Partie,
} from "@/lib/exercises/constants";
import type { ThemeFamily } from "@/lib/themes/queries";
import { ThemesPicker } from "./themes-picker";
import { MaterielInput } from "./materiel-input";
import { createExercise, updateExercise, type ExerciseInput } from "./actions";

export function ExerciseForm({
  mode,
  exerciseId,
  themeFamilies,
  clubCategories,
  initial,
}: {
  mode: "create" | "edit";
  exerciseId?: string;
  themeFamilies: ThemeFamily[];
  clubCategories: string[];
  initial?: {
    titre: string;
    partie: string;
    dureeDefautMinutes: string;
    consignes: string;
    themeIds: string[];
    categories: string[];
    nbJoueursMin: string;
    nbJoueursMax: string;
    espace: string;
    materiel: string[];
    intensite: string;
    opposition: string;
  };
}) {
  const [titre, setTitre] = useState(initial?.titre ?? "");
  const [partie, setPartie] = useState<Partie>((initial?.partie as Partie) ?? "theme");
  const [duree, setDuree] = useState(initial?.dureeDefautMinutes ?? "");
  const [consignes, setConsignes] = useState(initial?.consignes ?? "");
  const [themeIds, setThemeIds] = useState<string[]>(initial?.themeIds ?? []);
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
  const [nbJoueursMin, setNbJoueursMin] = useState(initial?.nbJoueursMin ?? "");
  const [nbJoueursMax, setNbJoueursMax] = useState(initial?.nbJoueursMax ?? "");
  const [espace, setEspace] = useState(initial?.espace ?? "");
  const [materiel, setMateriel] = useState<string[]>(initial?.materiel ?? []);
  const [intensite, setIntensite] = useState(initial?.intensite ?? "");
  const [opposition, setOpposition] = useState(initial?.opposition ?? "");
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

    const input: ExerciseInput = {
      titre,
      partie,
      dureeDefautMinutes: duree,
      consignes,
      themeIds,
      categories,
      nbJoueursMin,
      nbJoueursMax,
      espace,
      materiel,
      intensite,
      opposition,
    };

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
        <label className="flex min-w-0 flex-1 flex-col gap-1">
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
        <label className="flex w-28 shrink-0 flex-col gap-1">
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

      <div className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Thématiques</span>
        <ThemesPicker families={themeFamilies} selected={themeIds} onChange={setThemeIds} />
      </div>

      {clubCategories.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-anthracite/60">Catégorie d&apos;âge</span>
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

      <div className="flex gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Joueurs min.</span>
          <input
            type="number"
            min={1}
            max={50}
            value={nbJoueursMin}
            onChange={(e) => setNbJoueursMin(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Joueurs max.</span>
          <input
            type="number"
            min={1}
            max={50}
            value={nbJoueursMax}
            onChange={(e) => setNbJoueursMax(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
      </div>

      <div className="flex gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Espace</span>
          <select
            value={espace}
            onChange={(e) => setEspace(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          >
            <option value="">—</option>
            {ESPACES.map((e) => (
              <option key={e} value={e}>
                {ESPACE_LABELS[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Intensité</span>
          <select
            value={intensite}
            onChange={(e) => setIntensite(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          >
            <option value="">—</option>
            {INTENSITES.map((i) => (
              <option key={i} value={i}>
                {INTENSITE_LABELS[i]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Opposition</span>
        <select
          value={opposition}
          onChange={(e) => setOpposition(e.target.value)}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
        >
          <option value="">—</option>
          {OPPOSITIONS.map((o) => (
            <option key={o} value={o}>
              {OPPOSITION_LABELS[o]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Matériel</span>
        <MaterielInput items={materiel} onChange={setMateriel} />
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
