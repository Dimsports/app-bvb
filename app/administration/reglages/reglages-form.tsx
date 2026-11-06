"use client";

import { useState, useTransition } from "react";
import type { ClubSettings } from "@/lib/club/settings";
import { updateClubSettings } from "./actions";

export function ReglagesForm({ initial }: { initial: ClubSettings }) {
  const [nom, setNom] = useState(initial.nom);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [saisonDebut, setSaisonDebut] = useState(initial.saison_debut ?? "");
  const [saisonFin, setSaisonFin] = useState(initial.saison_fin ?? "");
  const [gymnases, setGymnases] = useState(initial.gymnases.join(", "));
  const [categories, setCategories] = useState(initial.categories.join(", "));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateClubSettings({ nom, logoUrl, saisonDebut, saisonFin, gymnases, categories });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Nom du club</span>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="h-11 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">URL du logo (facultatif)</span>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="h-11 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Début de saison</span>
          <input
            type="date"
            value={saisonDebut}
            onChange={(e) => setSaisonDebut(e.target.value)}
            className="h-11 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Fin de saison</span>
          <input
            type="date"
            value={saisonFin}
            onChange={(e) => setSaisonFin(e.target.value)}
            className="h-11 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Gymnases (séparés par des virgules)</span>
        <input
          type="text"
          value={gymnases}
          onChange={(e) => setGymnases(e.target.value)}
          placeholder="Salle des sports, Gymnase Jean Monnet…"
          className="h-11 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Catégories d&apos;âge (séparées par des virgules)</span>
        <input
          type="text"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="U9, U11, U13, U15, U17, U18"
          className="h-11 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-turquoise-contrast">Enregistré.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
