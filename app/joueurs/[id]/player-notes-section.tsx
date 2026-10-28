"use client";

import { useState, useTransition } from "react";
import type { PlayerNote } from "@/lib/notes/queries";
import { addPlayerNote, deletePlayerNote } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function PlayerNotesSection({
  playerId,
  currentMemberId,
  canDeleteAny,
  initialNotes,
}: {
  playerId: string;
  currentMemberId: string;
  canDeleteAny: boolean;
  initialNotes: PlayerNote[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const contenu = draft.trim();
    if (!contenu) return;
    setError(null);

    const placeholder: PlayerNote = {
      id: `local-${crypto.randomUUID()}`,
      contenu,
      created_at: new Date().toISOString(),
      author_id: currentMemberId,
      author: null,
    };
    setNotes((prev) => [placeholder, ...prev]);
    setDraft("");

    startTransition(async () => {
      const result = await addPlayerNote(playerId, contenu);
      if (!result.ok) {
        setError(result.error);
        setNotes((prev) => prev.filter((n) => n.id !== placeholder.id));
      }
    });
  }

  function handleDelete(noteId: string) {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    startTransition(() => {
      deletePlayerNote(playerId, noteId);
    });
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Suivi</h2>

      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Observation, progrès, point à travailler…"
          rows={3}
          className="rounded-lg border border-anthracite/20 p-3 text-sm text-anthracite"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={isPending || !draft.trim()}
          onClick={handleAdd}
          className="h-11 self-start rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>

      {notes.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {notes.map((n) => {
            const canDelete = canDeleteAny || n.author_id === currentMemberId;
            return (
              <li key={n.id} className="rounded-lg bg-anthracite/5 px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-anthracite/50">
                    {DATE_FORMAT.format(new Date(n.created_at))}
                    {n.author ? ` · ${n.author.prenom} ${n.author.nom}` : ""}
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="shrink-0 text-xs text-anthracite/40 hover:text-anthracite"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-anthracite">{n.contenu}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-anthracite/50">Aucune note pour l&apos;instant.</p>
      )}
    </section>
  );
}
