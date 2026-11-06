"use client";

import { useState, useTransition } from "react";
import type { ThemeFamily } from "@/lib/themes/queries";
import { addTheme, renameTheme, deleteTheme } from "./actions";

function ThemeRow({ themeId, nom }: { themeId: string; nom: string }) {
  const [value, setValue] = useState(nom);
  const [isPending, startTransition] = useTransition();

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === nom) {
      setValue(nom);
      return;
    }
    startTransition(() => {
      renameTheme(themeId, trimmed);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        disabled={isPending}
        className="h-11 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm disabled:opacity-60"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm(`Supprimer « ${nom} » ?`)) return;
          startTransition(() => {
            deleteTheme(themeId);
          });
        }}
        aria-label={`Supprimer ${nom}`}
        className="h-11 w-11 shrink-0 rounded-lg border border-red-200 text-red-700 disabled:opacity-60"
      >
        ×
      </button>
    </div>
  );
}

function FamilyCard({ family }: { family: ThemeFamily }) {
  const [newNom, setNewNom] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newNom.trim();
    if (!trimmed) return;
    startTransition(() => {
      addTheme(family.id, trimmed);
    });
    setNewNom("");
  }

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="font-medium text-anthracite">{family.nom}</h2>

      <div className="mt-3 flex flex-col gap-2">
        {family.themes.map((t) => (
          <ThemeRow key={t.id} themeId={t.id} nom={t.nom} />
        ))}
        {family.themes.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucune thématique.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          value={newNom}
          onChange={(e) => setNewNom(e.target.value)}
          placeholder="Nouvelle thématique…"
          className="h-11 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={isPending || !newNom.trim()}
          className="h-11 shrink-0 rounded-lg border border-anthracite/20 px-3 text-sm font-medium text-anthracite disabled:opacity-60"
        >
          Ajouter
        </button>
      </form>
    </section>
  );
}

export function ThemesBoard({ families }: { families: ThemeFamily[] }) {
  return (
    <div className="flex flex-col gap-4">
      {families.map((f) => (
        <FamilyCard key={f.id} family={f} />
      ))}
    </div>
  );
}
