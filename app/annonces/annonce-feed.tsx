"use client";

import { useState, useTransition } from "react";
import type { Annonce } from "@/lib/annonces/queries";
import { createAnnonce, deleteAnnonce } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function AnnonceFeed({ canPost, initialAnnonces }: { canPost: boolean; initialAnnonces: Annonce[] }) {
  const [annonces, setAnnonces] = useState(initialAnnonces);
  const [posting, setPosting] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePost() {
    const cleanTitre = titre.trim();
    const cleanContenu = contenu.trim();
    if (!cleanTitre || !cleanContenu) return;
    setError(null);

    setAnnonces((prev) => [
      {
        id: `local-${crypto.randomUUID()}`,
        titre: cleanTitre,
        contenu: cleanContenu,
        created_at: new Date().toISOString(),
        author: null,
      },
      ...prev,
    ]);
    setTitre("");
    setContenu("");
    setPosting(false);

    startTransition(async () => {
      const result = await createAnnonce(cleanTitre, cleanContenu);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDelete(annonceId: string) {
    setAnnonces((prev) => prev.filter((a) => a.id !== annonceId));
    startTransition(() => {
      deleteAnnonce(annonceId);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canPost &&
        (posting ? (
          <section className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Titre"
                className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm text-anthracite"
              />
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Message"
                rows={3}
                className="rounded-lg border border-anthracite/20 p-3 text-sm text-anthracite"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isPending || !titre.trim() || !contenu.trim()}
                  onClick={handlePost}
                  className="h-10 rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-40"
                >
                  Publier
                </button>
                <button
                  type="button"
                  onClick={() => setPosting(false)}
                  className="h-10 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
                >
                  Annuler
                </button>
              </div>
            </div>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setPosting(true)}
            className="h-12 self-start rounded-xl bg-anthracite px-5 font-medium text-white"
          >
            + Nouvelle annonce
          </button>
        ))}

      {annonces.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {annonces.map((a) => (
            <li key={a.id} className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-title text-lg text-anthracite">{a.titre}</h2>
                {canPost && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="shrink-0 text-xs text-anthracite/40 hover:text-anthracite"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-anthracite">{a.contenu}</p>
              <p className="mt-2 text-xs text-anthracite/50">
                {a.author ? `${a.author.prenom} ${a.author.nom}` : ""}
                {a.author ? " · " : ""}
                {DATE_FORMAT.format(new Date(a.created_at))}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-anthracite/50">Aucune annonce pour l&apos;instant.</p>
      )}
    </div>
  );
}
