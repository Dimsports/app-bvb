"use client";

import { useState, useTransition } from "react";
import type { Mission } from "@/lib/matches/queries";
import { addMission, removeMission } from "./actions";

export function MissionsSection({
  matchId,
  canEdit,
  initialMissions,
}: {
  matchId: string;
  canEdit: boolean;
  initialMissions: Mission[];
}) {
  const [missions, setMissions] = useState(initialMissions);
  const [titre, setTitre] = useState("");
  const [besoin, setBesoin] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addMission(matchId, titre, besoin);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMissions((prev) => [
        ...prev,
        { id: crypto.randomUUID(), match_id: matchId, titre: titre.trim(), besoin, inscrits: [] },
      ]);
      setTitre("");
      setBesoin(1);
    });
  }

  function handleRemove(missionId: string) {
    setMissions((prev) => prev.filter((m) => m.id !== missionId));
    startTransition(() => {
      removeMission(matchId, missionId);
    });
  }

  if (!canEdit && missions.length === 0) return null;

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Missions bénévoles</h2>

      <ul className="mt-4 flex flex-col gap-2">
        {missions.map((m) => (
          <li key={m.id} className="rounded-lg bg-anthracite/5 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-anthracite">
                {m.titre} · {m.inscrits.length}/{m.besoin}
              </span>
              {canEdit && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemove(m.id)}
                  className="text-sm font-medium text-red-700"
                >
                  Supprimer
                </button>
              )}
            </div>
            {m.inscrits.length > 0 && (
              <p className="mt-1 text-xs text-anthracite/50">
                {m.inscrits.map((p) => `${p.prenom} ${p.nom}`).join(", ")}
              </p>
            )}
          </li>
        ))}
        {missions.length === 0 && (
          <p className="text-sm text-anthracite/50">Aucune mission pour l&apos;instant.</p>
        )}
      </ul>

      {canEdit && (
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex. Table de marque"
            className="h-11 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm"
            required
          />
          <input
            type="number"
            min={1}
            max={20}
            value={besoin}
            onChange={(e) => setBesoin(Number(e.target.value))}
            className="h-11 w-16 rounded-lg border border-anthracite/20 px-2 text-center text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            Ajouter
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
