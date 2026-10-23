"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, GENRES, GENRE_LABELS, type Categorie, type Genre } from "@/lib/teams/constants";
import { createTeam } from "./actions";

export function CreateTeamForm() {
  const [categorie, setCategorie] = useState<Categorie>("U15");
  const [genre, setGenre] = useState<Genre>("Mixte");
  const [nom, setNom] = useState("");
  const [gymnase, setGymnase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTeam({ categorie, genre, nom, gymnase });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/equipes/${result.id}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm"
    >
      <h2 className="font-title text-xl text-anthracite">Nouvelle équipe</h2>

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

      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom (optionnel, ex. U15 Filles A)"
        className="h-12 rounded-lg border border-anthracite/20 px-3"
      />

      <input
        value={gymnase}
        onChange={(e) => setGymnase(e.target.value)}
        placeholder="Gymnase"
        className="h-12 rounded-lg border border-anthracite/20 px-3"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer l'équipe"}
      </button>
    </form>
  );
}
