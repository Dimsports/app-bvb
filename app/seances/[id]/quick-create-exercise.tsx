"use client";

import { useState, useTransition } from "react";
import { PARTIES, PARTIE_LABELS, type Partie } from "@/lib/exercises/constants";
import type { SeanceBloc } from "@/lib/seances/queries";
import { createExercise } from "@/app/bibliotheque/actions";
import { addBloc } from "../actions";

export function QuickCreateExercise({
  seanceId,
  canAttach,
  onAdded,
}: {
  seanceId: string;
  canAttach: boolean;
  onAdded: (bloc: SeanceBloc) => void;
}) {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [partie, setPartie] = useState<Partie>("theme");
  const [duree, setDuree] = useState("");
  const [consignes, setConsignes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitre("");
    setPartie("theme");
    setDuree("");
    setConsignes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createExercise({
        titre,
        partie,
        dureeDefautMinutes: duree,
        consignes,
        themeIds: [],
        categories: [],
        nbJoueursMin: "",
        nbJoueursMax: "",
        espace: "",
        materiel: [],
        intensite: "",
        opposition: "",
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (canAttach) {
        const blocResult = await addBloc(seanceId, result.id);
        if (blocResult.ok) onAdded(blocResult.bloc);
      } else {
        setMessage("Exercice ajouté à la bibliothèque du club.");
      }

      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 rounded-lg border border-anthracite/20 text-sm font-medium text-anthracite"
      >
        + Créer un nouvel exercice
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-background p-4">
      <input
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Titre de l'exercice"
        className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm"
        required
      />
      <div className="flex gap-2">
        <select
          value={partie}
          onChange={(e) => setPartie(e.target.value as Partie)}
          className="h-11 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm"
        >
          {PARTIES.map((p) => (
            <option key={p} value={p}>
              {PARTIE_LABELS[p]}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={180}
          value={duree}
          onChange={(e) => setDuree(e.target.value)}
          placeholder="Min"
          className="h-11 w-20 shrink-0 rounded-lg border border-anthracite/20 px-3 text-sm"
        />
      </div>
      <textarea
        value={consignes}
        onChange={(e) => setConsignes(e.target.value)}
        placeholder="Consignes (facultatif)"
        rows={3}
        className="rounded-lg border border-anthracite/20 px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-turquoise-contrast">{message}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-11 flex-1 rounded-lg bg-anthracite text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Création…" : canAttach ? "Créer et ajouter à la séance" : "Créer dans la bibliothèque"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm text-anthracite"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
