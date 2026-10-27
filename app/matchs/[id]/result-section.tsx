"use client";

import { useState, useTransition } from "react";
import { updateMatchResult } from "./actions";

type Props = {
  matchId: string;
  initialScoreBvb: number | null;
  initialScoreAdversaire: number | null;
  initialNoteCoach: string | null;
};

export function ResultSection({
  matchId,
  initialScoreBvb,
  initialScoreAdversaire,
  initialNoteCoach,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [scoreBvb, setScoreBvb] = useState(initialScoreBvb);
  const [scoreAdversaire, setScoreAdversaire] = useState(initialScoreAdversaire);
  const [noteCoach, setNoteCoach] = useState(initialNoteCoach ?? "");
  const [draftScoreBvb, setDraftScoreBvb] = useState(initialScoreBvb?.toString() ?? "");
  const [draftScoreAdversaire, setDraftScoreAdversaire] = useState(
    initialScoreAdversaire?.toString() ?? ""
  );
  const [draftNoteCoach, setDraftNoteCoach] = useState(initialNoteCoach ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasScore = scoreBvb !== null && scoreAdversaire !== null;

  function openEditor() {
    setDraftScoreBvb(scoreBvb?.toString() ?? "");
    setDraftScoreAdversaire(scoreAdversaire?.toString() ?? "");
    setDraftNoteCoach(noteCoach);
    setError(null);
    setEditing(true);
  }

  function handleSave() {
    const parsedBvb = draftScoreBvb.trim() === "" ? null : Number(draftScoreBvb);
    const parsedAdversaire = draftScoreAdversaire.trim() === "" ? null : Number(draftScoreAdversaire);

    if (
      (parsedBvb !== null && (!Number.isInteger(parsedBvb) || parsedBvb < 0)) ||
      (parsedAdversaire !== null && (!Number.isInteger(parsedAdversaire) || parsedAdversaire < 0))
    ) {
      setError("Scores invalides.");
      return;
    }

    setError(null);
    const nextScoreBvb = parsedBvb;
    const nextScoreAdversaire = parsedAdversaire;
    const nextNoteCoach = draftNoteCoach.trim();

    setScoreBvb(nextScoreBvb);
    setScoreAdversaire(nextScoreAdversaire);
    setNoteCoach(nextNoteCoach);
    setEditing(false);

    startTransition(async () => {
      const result = await updateMatchResult(matchId, nextScoreBvb, nextScoreAdversaire, nextNoteCoach);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <div className="mt-4">
        {hasScore && (
          <p className="font-title text-3xl text-anthracite">
            {scoreBvb} – {scoreAdversaire}
          </p>
        )}

        {noteCoach && (
          <div className="mt-4 rounded-lg bg-anthracite/5 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-anthracite/40">
              Note du coach
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-anthracite">{noteCoach}</p>
          </div>
        )}

        <button
          type="button"
          onClick={openEditor}
          className="mt-4 h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
        >
          {hasScore || noteCoach ? "Modifier le résultat" : "Ajouter le résultat"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={draftScoreBvb}
          onChange={(e) => setDraftScoreBvb(e.target.value)}
          placeholder="BVB"
          className="h-11 w-20 rounded-lg border border-anthracite/20 px-3 text-center text-anthracite"
        />
        <span className="text-anthracite/40">–</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={draftScoreAdversaire}
          onChange={(e) => setDraftScoreAdversaire(e.target.value)}
          placeholder="Adv."
          className="h-11 w-20 rounded-lg border border-anthracite/20 px-3 text-center text-anthracite"
        />
      </div>

      <textarea
        value={draftNoteCoach}
        onChange={(e) => setDraftNoteCoach(e.target.value)}
        placeholder="Note privée du coach (visible uniquement par le staff de l'équipe)"
        rows={4}
        className="rounded-lg border border-anthracite/20 p-3 text-sm text-anthracite"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="h-11 rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
