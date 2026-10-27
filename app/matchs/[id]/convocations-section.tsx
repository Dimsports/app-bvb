"use client";

import { useState, useTransition } from "react";
import type { ConvocationRow } from "@/lib/matches/queries";
import { CONVOCATION_STATUT_LABELS, isConvocationStatut } from "@/lib/matches/constants";
import { toggleConvocation } from "./actions";

function StatutBadge({ statut }: { statut: string | null }) {
  if (!statut) {
    return <span className="text-xs text-anthracite/40">Non convoqué</span>;
  }
  const label = isConvocationStatut(statut) ? CONVOCATION_STATUT_LABELS[statut] : statut;
  const color =
    statut === "confirme"
      ? "bg-turquoise/20 text-turquoise-contrast"
      : statut === "decline"
        ? "bg-red-100 text-red-700"
        : "bg-anthracite/10 text-anthracite/60";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

export function ConvocationsSection({
  matchId,
  canEdit,
  initialRows,
}: {
  matchId: string;
  canEdit: boolean;
  initialRows: ConvocationRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();

  function handleToggle(memberId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.member.id === memberId
          ? { ...r, statut: r.statut ? null : "en_attente" }
          : r
      )
    );
    startTransition(() => {
      toggleConvocation(matchId, memberId);
    });
  }

  const convokedCount = rows.filter((r) => r.statut).length;

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-title text-xl text-anthracite">Convocations</h2>
        <span className="text-sm text-anthracite/60">
          {convokedCount} / {rows.length}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {rows.map(({ member, statut }) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-anthracite/5 px-3 py-2"
          >
            <span className="text-sm font-medium text-anthracite">
              {member.prenom} {member.nom}
            </span>
            <div className="flex items-center gap-2">
              <StatutBadge statut={statut} />
              {canEdit && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(member.id)}
                  className="text-sm font-medium text-turquoise-contrast"
                >
                  {statut ? "Retirer" : "Convoquer"}
                </button>
              )}
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-anthracite/50">Aucun joueur dans l&apos;effectif.</p>
        )}
      </ul>
    </section>
  );
}
