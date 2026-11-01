"use client";

import { useState, useTransition } from "react";
import type { BenevoleProfile } from "@/lib/benevoles/queries";
import { updateBenevoleProfile } from "./actions";

export function ProfileSection({ initialProfile }: { initialProfile: BenevoleProfile }) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasInfo = profile.contact_telephone || profile.contact_email || profile.disponibilites;

  function openEditor() {
    setDraft(profile);
    setError(null);
    setEditing(true);
  }

  function handleSave() {
    setError(null);
    setProfile(draft);
    setEditing(false);
    startTransition(async () => {
      const result = await updateBenevoleProfile(draft);
      if (!result.ok) setError(result.error);
    });
  }

  if (!editing) {
    return (
      <section className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="font-medium text-anthracite">Mon profil</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          {profile.contact_telephone && (
            <div className="flex justify-between gap-4">
              <dt className="text-anthracite/50">Téléphone</dt>
              <dd className="text-anthracite">{profile.contact_telephone}</dd>
            </div>
          )}
          {profile.contact_email && (
            <div className="flex justify-between gap-4">
              <dt className="text-anthracite/50">Email</dt>
              <dd className="text-anthracite">{profile.contact_email}</dd>
            </div>
          )}
          {profile.disponibilites && (
            <div>
              <dt className="text-anthracite/50">Disponibilités</dt>
              <dd className="mt-1 text-anthracite">{profile.disponibilites}</dd>
            </div>
          )}
          {!hasInfo && <p className="text-anthracite/50">Aucune information renseignée.</p>}
        </dl>
        <button
          type="button"
          onClick={openEditor}
          className="mt-4 h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
        >
          {hasInfo ? "Modifier" : "Compléter mon profil"}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="font-medium text-anthracite">Mon profil</h2>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-anthracite/60">
          Téléphone
          <input
            type="tel"
            value={draft.contact_telephone ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, contact_telephone: e.target.value || null }))}
            className="h-11 rounded-lg border border-anthracite/20 px-3 text-anthracite"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-anthracite/60">
          Email
          <input
            type="email"
            value={draft.contact_email ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, contact_email: e.target.value || null }))}
            className="h-11 rounded-lg border border-anthracite/20 px-3 text-anthracite"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-anthracite/60">
          Disponibilités
          <textarea
            value={draft.disponibilites ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, disponibilites: e.target.value || null }))}
            placeholder="Ex. Disponible les week-ends, pas le vendredi soir…"
            rows={3}
            className="rounded-lg border border-anthracite/20 p-3 text-sm text-anthracite"
          />
        </label>

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
    </section>
  );
}
