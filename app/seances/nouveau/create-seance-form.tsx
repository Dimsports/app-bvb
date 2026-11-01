"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { teamLabel } from "@/lib/teams/constants";
import type { Team } from "@/lib/teams/queries";
import type { CycleOption } from "@/lib/cycles/queries";
import { getVacanceForDate } from "@/lib/season/vacances";
import { createSeance } from "../actions";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateSeanceForm({ teams, cycles }: { teams: Team[]; cycles: CycleOption[] }) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [date, setDate] = useState(todayISO());
  const [heureDebut, setHeureDebut] = useState("18:00");
  const [heureFin, setHeureFin] = useState("19:30");
  const [titre, setTitre] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const teamCycles = cycles.filter((c) => c.team_id === teamId);
  const vacance = getVacanceForDate(date);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!teamId) {
      setError("Choisissez une équipe.");
      return;
    }

    startTransition(async () => {
      const result = await createSeance({ teamId, date, heureDebut, heureFin, titre, cycleId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/seances/${result.id}`);
    });
  }

  if (teams.length === 0) {
    return (
      <p className="text-sm text-anthracite/60">
        Aucune équipe ne vous est rattachée. Demandez à l&apos;admin de vous ajouter au staff
        d&apos;une équipe.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Équipe</span>
        <select
          value={teamId}
          onChange={(e) => {
            setTeamId(e.target.value);
            setCycleId("");
          }}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {teamLabel(t)}
            </option>
          ))}
        </select>
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
        {vacance && (
          <p className="text-xs text-anthracite/50">
            {vacance.nom}
            {vacance.dateFin ? ` jusqu'au ${vacance.dateFin.split("-").reverse().join("/")}` : ""}
          </p>
        )}
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Heure de début</span>
          <input
            type="time"
            value={heureDebut}
            onChange={(e) => setHeureDebut(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm text-anthracite/60">Heure de fin</span>
          <input
            type="time"
            value={heureFin}
            onChange={(e) => setHeureFin(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Titre (optionnel)</span>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex. Défense sur porteur de balle"
          className="h-12 rounded-lg border border-anthracite/20 px-3"
        />
      </label>

      {teamCycles.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-anthracite/60">Cycle (optionnel)</span>
          <select
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          >
            <option value="">Aucun cycle</option>
            {teamCycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer la séance"}
      </button>
    </form>
  );
}
