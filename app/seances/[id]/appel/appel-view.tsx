"use client";

import { useState, useTransition } from "react";
import type { TeamMember } from "@/lib/teams/queries";
import { togglePresence } from "./actions";

export function AppelView({
  seanceId,
  roster,
  initialPresentIds,
}: {
  seanceId: string;
  roster: TeamMember[];
  initialPresentIds: string[];
}) {
  const [presentIds, setPresentIds] = useState(new Set(initialPresentIds));
  const [, startTransition] = useTransition();

  function handleToggle(memberId: string) {
    const willBePresent = !presentIds.has(memberId);
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (willBePresent) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
    startTransition(() => {
      togglePresence(seanceId, memberId);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-turquoise-contrast">
        {presentIds.size} / {roster.length} présents
      </p>

      <ul className="flex flex-col gap-2">
        {roster.map((member) => {
          const present = presentIds.has(member.id);
          return (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => handleToggle(member.id)}
                className={`flex h-16 w-full items-center justify-between rounded-xl px-5 text-left text-lg font-medium transition ${
                  present
                    ? "bg-turquoise text-on-turquoise"
                    : "bg-card text-anthracite shadow-sm"
                }`}
              >
                <span>
                  {member.prenom} {member.nom}
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    present ? "border-on-turquoise" : "border-anthracite/20"
                  }`}
                >
                  {present ? "✓" : ""}
                </span>
              </button>
            </li>
          );
        })}
        {roster.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucun joueur dans l&apos;effectif.</p>
        )}
      </ul>
    </div>
  );
}
