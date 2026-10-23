"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSeanceInfo, deleteSeance } from "../actions";

export function SeanceInfoForm({
  seanceId,
  initial,
}: {
  seanceId: string;
  initial: { date: string; heureDebut: string; heureFin: string; titre: string };
}) {
  const [date, setDate] = useState(initial.date);
  const [heureDebut, setHeureDebut] = useState(initial.heureDebut);
  const [heureFin, setHeureFin] = useState(initial.heureFin);
  const [titre, setTitre] = useState(initial.titre);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSeanceInfo(seanceId, { date, heureDebut, heureFin, titre });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer cette séance ?")) return;
    startTransition(async () => {
      const result = await deleteSeance(seanceId);
      if (result.ok) router.push("/seances");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Titre (optionnel)</span>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
          required
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Début</span>
          <input
            type="time"
            value={heureDebut}
            onChange={(e) => setHeureDebut(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Fin</span>
          <input
            type="time"
            value={heureFin}
            onChange={(e) => setHeureFin(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
      </div>

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
