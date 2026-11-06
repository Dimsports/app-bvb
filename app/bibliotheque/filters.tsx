"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PARTIES,
  PARTIE_LABELS,
  ESPACES,
  ESPACE_LABELS,
  INTENSITES,
  INTENSITE_LABELS,
  OPPOSITIONS,
  OPPOSITION_LABELS,
} from "@/lib/exercises/constants";
import type { ThemeFamily } from "@/lib/themes/queries";

export function Filters({
  themeFamilies,
  clubCategories,
}: {
  themeFamilies: ThemeFamily[];
  clubCategories: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const partie = searchParams.get("partie") ?? "";
  const q = searchParams.get("q") ?? "";
  const theme = searchParams.get("theme") ?? "";
  const categorie = searchParams.get("categorie") ?? "";
  const espace = searchParams.get("espace") ?? "";
  const intensite = searchParams.get("intensite") ?? "";
  const opposition = searchParams.get("opposition") ?? "";
  const joueurs = searchParams.get("joueurs") ?? "";

  const activeExtra = [theme, categorie, espace, intensite, opposition, joueurs].filter(Boolean).length;

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { partie, q, theme, categorie, espace, intensite, opposition, joueurs, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/bibliotheque?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          defaultValue={q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Rechercher un exercice…"
          className="h-12 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3"
        />
        <select
          value={partie}
          onChange={(e) => update({ partie: e.target.value })}
          className="h-12 rounded-lg border border-anthracite/20 px-3"
        >
          <option value="">Toutes les parties</option>
          {PARTIES.map((p) => (
            <option key={p} value={p}>
              {PARTIE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="self-start text-sm font-medium text-turquoise-contrast"
      >
        {expanded ? "Moins de filtres" : "Plus de filtres"}
        {activeExtra > 0 ? ` (${activeExtra})` : ""}
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm">
          <select
            value={theme}
            onChange={(e) => update({ theme: e.target.value })}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          >
            <option value="">Toutes les thématiques</option>
            {themeFamilies.map((family) => (
              <optgroup key={family.id} label={family.nom}>
                {family.themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {clubCategories.length > 0 && (
            <select
              value={categorie}
              onChange={(e) => update({ categorie: e.target.value })}
              className="h-12 rounded-lg border border-anthracite/20 px-3"
            >
              <option value="">Toutes les catégories</option>
              {clubCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-3">
            <select
              value={espace}
              onChange={(e) => update({ espace: e.target.value })}
              className="h-12 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3"
            >
              <option value="">Tous les espaces</option>
              {ESPACES.map((e) => (
                <option key={e} value={e}>
                  {ESPACE_LABELS[e]}
                </option>
              ))}
            </select>
            <select
              value={intensite}
              onChange={(e) => update({ intensite: e.target.value })}
              className="h-12 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3"
            >
              <option value="">Toutes intensités</option>
              {INTENSITES.map((i) => (
                <option key={i} value={i}>
                  {INTENSITE_LABELS[i]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <select
              value={opposition}
              onChange={(e) => update({ opposition: e.target.value })}
              className="h-12 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3"
            >
              <option value="">Toute opposition</option>
              {OPPOSITIONS.map((o) => (
                <option key={o} value={o}>
                  {OPPOSITION_LABELS[o]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={50}
              defaultValue={joueurs}
              onChange={(e) => update({ joueurs: e.target.value })}
              placeholder="Nb joueurs"
              className="h-12 w-32 shrink-0 rounded-lg border border-anthracite/20 px-3"
            />
          </div>

          {activeExtra > 0 && (
            <button
              type="button"
              onClick={() =>
                update({ theme: "", categorie: "", espace: "", intensite: "", opposition: "", joueurs: "" })
              }
              className="self-start text-sm text-anthracite/60 underline"
            >
              Réinitialiser ces filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
