"use client";

import { useState, useTransition } from "react";
import { JOURS, jourLabel } from "@/lib/teams/constants";
import type { Creneau } from "@/lib/teams/queries";
import { addCreneau, removeCreneau } from "../actions";

export function CreneauxSection({
  teamId,
  creneaux,
}: {
  teamId: string;
  creneaux: Creneau[];
}) {
  const [list, setList] = useState(creneaux);
  const [jour, setJour] = useState(2);
  const [heureDebut, setHeureDebut] = useState("18:00");
  const [heureFin, setHeureFin] = useState("19:30");
  const [lieu, setLieu] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCreneau(teamId, {
        jour,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        lieu,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setList((prev) =>
        [...prev, { id: crypto.randomUUID(), team_id: teamId, jour, heure_debut: heureDebut, heure_fin: heureFin, lieu: lieu || null }].sort(
          (a, b) => a.jour - b.jour
        )
      );
      setLieu("");
    });
  }

  function handleRemove(creneauId: string) {
    startTransition(async () => {
      const result = await removeCreneau(teamId, creneauId);
      if (result.ok) {
        setList((prev) => prev.filter((c) => c.id !== creneauId));
      }
    });
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Créneaux d&apos;entraînement</h2>

      <ul className="mt-4 flex flex-col gap-2">
        {list.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg bg-anthracite/5 px-3 py-2"
          >
            <span className="text-sm text-anthracite">
              {jourLabel(c.jour)} {c.heure_debut.slice(0, 5)}–{c.heure_fin.slice(0, 5)}
              {c.lieu ? ` · ${c.lieu}` : ""}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRemove(c.id)}
              className="text-sm font-medium text-red-700"
            >
              Retirer
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-anthracite/50">Aucun créneau pour l&apos;instant.</p>
        )}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <select
            value={jour}
            onChange={(e) => setJour(Number(e.target.value))}
            className="h-11 flex-1 rounded-lg border border-anthracite/20 px-2 text-sm"
          >
            {JOURS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={heureDebut}
            onChange={(e) => setHeureDebut(e.target.value)}
            className="h-11 rounded-lg border border-anthracite/20 px-2 text-sm"
          />
          <input
            type="time"
            value={heureFin}
            onChange={(e) => setHeureFin(e.target.value)}
            className="h-11 rounded-lg border border-anthracite/20 px-2 text-sm"
          />
        </div>
        <input
          value={lieu}
          onChange={(e) => setLieu(e.target.value)}
          placeholder="Lieu (optionnel, sinon le gymnase de l'équipe)"
          className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-lg bg-anthracite text-sm font-medium text-white disabled:opacity-60"
        >
          Ajouter le créneau
        </button>
      </form>
    </section>
  );
}
