"use client";

import { useState, useTransition } from "react";
import type { WellbeingEntry } from "@/lib/wellbeing/queries";
import { submitWellbeing } from "./actions";

type Scale = { key: "sommeil" | "forme" | "courbatures" | "moral"; label: string; low: string; high: string };

const SCALES: Scale[] = [
  { key: "sommeil", label: "Sommeil", low: "Mauvais", high: "Excellent" },
  { key: "forme", label: "Forme", low: "Épuisé", high: "En pleine forme" },
  { key: "courbatures", label: "Courbatures", low: "Beaucoup", high: "Aucune" },
  { key: "moral", label: "Moral", low: "Bas", high: "Au top" },
];

type Values = { sommeil: number; forme: number; courbatures: number; moral: number };

export function WellbeingForm({ todayEntry }: { todayEntry: WellbeingEntry | null }) {
  const [submitted, setSubmitted] = useState(todayEntry);
  const [editing, setEditing] = useState(!todayEntry);
  const [values, setValues] = useState<Values>({
    sommeil: todayEntry?.sommeil ?? 3,
    forme: todayEntry?.forme ?? 3,
    courbatures: todayEntry?.courbatures ?? 3,
    moral: todayEntry?.moral ?? 3,
  });
  const [commentaire, setCommentaire] = useState(todayEntry?.commentaire ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    const payload = { ...values, commentaire };
    setSubmitted({ id: "local", date: "", commentaire: commentaire || null, ...values });
    setEditing(false);

    startTransition(async () => {
      const result = await submitWellbeing(payload);
      if (!result.ok) {
        setError(result.error);
        setEditing(true);
      }
    });
  }

  if (!editing && submitted) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="font-title text-xl text-anthracite">Questionnaire du jour</h2>
        <p className="mt-1 text-sm text-anthracite/60">Déjà complété aujourd&apos;hui. Merci !</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
        >
          Modifier ma réponse
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Comment te sens-tu aujourd&apos;hui ?</h2>

      <div className="mt-4 flex flex-col gap-5">
        {SCALES.map((scale) => (
          <div key={scale.key}>
            <p className="text-sm font-medium text-anthracite">{scale.label}</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, [scale.key]: n }))}
                  className={`flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-semibold ${
                    values[scale.key] === n
                      ? "bg-turquoise text-on-turquoise"
                      : "border border-anthracite/20 text-anthracite"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-anthracite/40">
              <span>{scale.low}</span>
              <span>{scale.high}</span>
            </div>
          </div>
        ))}

        <label className="flex flex-col gap-1 text-sm text-anthracite/60">
          Commentaire (facultatif)
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            className="rounded-lg border border-anthracite/20 p-3 text-sm text-anthracite"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-40"
        >
          Envoyer
        </button>
      </div>
    </section>
  );
}
