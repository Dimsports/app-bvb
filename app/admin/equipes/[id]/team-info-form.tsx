"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, GENRES, GENRE_LABELS, type Categorie, type Genre } from "@/lib/teams/constants";
import type { Team } from "@/lib/teams/queries";
import { updateTeam, deleteTeam } from "../actions";

export function TeamInfoForm({ team }: { team: Team }) {
  const [categorie, setCategorie] = useState<Categorie>(team.categorie as Categorie);
  const [genre, setGenre] = useState<Genre>(team.genre as Genre);
  const [nom, setNom] = useState(team.nom ?? "");
  const [gymnase, setGymnase] = useState(team.gymnase ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateTeam(team.id, { categorie, genre, nom, gymnase });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer cette équipe et toutes ses données associées ?")) return;
    startTransition(async () => {
      const result = await deleteTeam(team.id);
      if (result.ok) {
        router.push("/admin/equipes");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Catégorie</span>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as Categorie)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Genre</span>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {GENRE_LABELS[g]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Nom (optionnel)</span>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. U15 Filles A"
          className="h-12 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Gymnase</span>
        <input
          value={gymnase}
          onChange={(e) => setGymnase(e.target.value)}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-turquoise-contrast">Enregistré.</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-12 flex-1 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="h-12 rounded-xl border border-red-200 px-4 font-medium text-red-700"
        >
          Supprimer
        </button>
      </div>
    </form>
  );
}
