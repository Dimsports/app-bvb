"use client";

import { useState, useTransition } from "react";
import { teamLabel } from "@/lib/teams/constants";
import type { PlayerConvocation } from "@/lib/matches/queries";
import { respondConvocation } from "@/app/matchs/[id]/actions";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function ConvocationCard({ convocation }: { convocation: PlayerConvocation }) {
  const [statut, setStatut] = useState(convocation.statut);
  const [isPending, startTransition] = useTransition();
  const { match } = convocation;

  function respond(next: "confirme" | "decline") {
    setStatut(next);
    startTransition(() => {
      respondConvocation(match.id, next);
    });
  }

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-anthracite/50">
        {match.team ? teamLabel(match.team) : ""}
      </p>
      <p className="mt-1 font-title text-xl text-anthracite">
        {match.domicile ? "Contre" : "À l'extérieur contre"} {match.adversaire}
      </p>
      <p className="text-sm text-anthracite/60">
        {DATE_FORMAT.format(new Date(`${match.date}T00:00:00`))}
        {match.heure ? ` · ${match.heure.slice(0, 5)}` : ""}
        {match.salle ? ` · ${match.salle}` : ""}
      </p>

      {statut === "en_attente" ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => respond("confirme")}
            className="h-12 flex-1 rounded-xl bg-turquoise font-medium text-on-turquoise disabled:opacity-60"
          >
            Je viens
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => respond("decline")}
            className="h-12 flex-1 rounded-xl border border-anthracite/20 font-medium text-anthracite disabled:opacity-60"
          >
            Je ne viens pas
          </button>
        </div>
      ) : (
        <p
          className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${
            statut === "confirme"
              ? "bg-turquoise/20 text-turquoise-contrast"
              : "bg-red-100 text-red-700"
          }`}
        >
          {statut === "confirme" ? "Tu as confirmé ta présence" : "Tu as décliné"}
        </p>
      )}
    </section>
  );
}
