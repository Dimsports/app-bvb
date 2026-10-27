"use client";

import { useState, useTransition } from "react";
import { teamLabel } from "@/lib/teams/constants";
import type { MissionFeedEntry } from "@/lib/matches/queries";
import { toggleMyInscription } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function MissionsFeed({ feed }: { feed: MissionFeedEntry[] }) {
  const [entries, setEntries] = useState(feed);
  const [isPending, startTransition] = useTransition();

  function handleToggle(matchId: string, missionId: string) {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.match.id !== matchId) return entry;
        return {
          ...entry,
          missions: entry.missions.map((m) =>
            m.id === missionId
              ? {
                  ...m,
                  estInscrit: !m.estInscrit,
                  inscritCount: m.inscritCount + (m.estInscrit ? -1 : 1),
                }
              : m
          ),
        };
      })
    );
    startTransition(() => {
      toggleMyInscription(missionId);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map(({ match, missions }) => (
        <section key={match.id} className="rounded-2xl bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-anthracite/50">
            {match.team ? teamLabel(match.team) : ""}
          </p>
          <p className="font-title text-xl text-anthracite">
            {match.domicile ? "Contre" : "À l'extérieur contre"} {match.adversaire}
          </p>
          <p className="text-sm text-anthracite/60">
            {DATE_FORMAT.format(new Date(`${match.date}T00:00:00`))}
            {match.heure ? ` · ${match.heure.slice(0, 5)}` : ""}
            {match.salle ? ` · ${match.salle}` : ""}
          </p>

          <ul className="mt-3 flex flex-col gap-2">
            {missions.map((m) => {
              const full = m.inscritCount >= m.besoin && !m.estInscrit;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-anthracite/5 px-3 py-2"
                >
                  <span className="text-sm text-anthracite">
                    {m.titre} · {m.inscritCount}/{m.besoin}
                  </span>
                  <button
                    type="button"
                    disabled={isPending || full}
                    onClick={() => handleToggle(match.id, m.id)}
                    className={`h-9 rounded-lg px-3 text-sm font-medium disabled:opacity-40 ${
                      m.estInscrit
                        ? "bg-turquoise text-on-turquoise"
                        : "border border-anthracite/20 text-anthracite"
                    }`}
                  >
                    {m.estInscrit ? "Inscrit ✓" : full ? "Complet" : "S'inscrire"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {entries.length === 0 && (
        <p className="text-sm text-anthracite/60">Aucun besoin bénévole pour l&apos;instant.</p>
      )}
    </div>
  );
}
