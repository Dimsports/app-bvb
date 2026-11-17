"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaDisplay } from "@/app/bibliotheque/media-display";
import { setCompetenceLink } from "../actions";

export function LinkManager({
  competenceId,
  canEdit,
  mediaType,
  mediaUrl,
  mediaPlatform,
}: {
  competenceId: string;
  canEdit: boolean;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaPlatform: string | null;
}) {
  const router = useRouter();
  const [linkInput, setLinkInput] = useState(mediaUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setCompetenceLink(competenceId, linkInput);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!canEdit && !mediaUrl) return null;

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Média</h2>

      {mediaUrl && (
        <div className="mt-4">
          <MediaDisplay mediaType={mediaType} mediaUrl={mediaUrl} mediaPlatform={mediaPlatform} />
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Lien photo, vidéo, YouTube…"
            className="h-11 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            Valider
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
