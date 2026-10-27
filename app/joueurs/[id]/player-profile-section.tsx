"use client";

import { useState, useTransition } from "react";
import type { PlayerProfile } from "@/lib/players/queries";
import { updatePlayerProfile } from "./actions";

function ageFromDate(dateNaissance: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(`${dateNaissance}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

const DATE_DISPLAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function PlayerProfileSection({
  playerId,
  canEdit,
  initialProfile,
}: {
  playerId: string;
  canEdit: boolean;
  initialProfile: PlayerProfile;
}) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const age = ageFromDate(profile.date_naissance);
  const hasInfo =
    profile.date_naissance || profile.poste || profile.contact_nom || profile.contact_telephone || profile.contact_email;

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
      const result = await updatePlayerProfile(playerId, draft);
      if (!result.ok) setError(result.error);
    });
  }

  if (!editing) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="font-title text-xl text-anthracite">Informations</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          {profile.date_naissance && (
            <div className="flex justify-between gap-4">
              <dt className="text-anthracite/50">Date de naissance</dt>
              <dd className="text-anthracite">
                {DATE_DISPLAY.format(new Date(`${profile.date_naissance}T00:00:00`))}
                {age !== null ? ` (${age} ans)` : ""}
              </dd>
            </div>
          )}
          {profile.poste && (
            <div className="flex justify-between gap-4">
              <dt className="text-anthracite/50">Poste</dt>
              <dd className="text-anthracite">{profile.poste}</dd>
            </div>
          )}
          {profile.contact_nom && (
            <div className="flex justify-between gap-4">
              <dt className="text-anthracite/50">Contact</dt>
              <dd className="text-anthracite">{profile.contact_nom}</dd>
            </div>
          )}
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
          {!hasInfo && <p className="text-anthracite/50">Aucune information renseignée.</p>}
        </dl>

        {canEdit && (
          <button
            type="button"
            onClick={openEditor}
            className="mt-4 h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
          >
            {hasInfo ? "Modifier" : "Ajouter des informations"}
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Informations</h2>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-anthracite/60">
          Date de naissance
          <input
            type="date"
            value={draft.date_naissance ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, date_naissance: e.target.value || null }))}
            className="h-11 rounded-lg border border-anthracite/20 px-3 text-anthracite"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-anthracite/60">
          Poste
          <input
            type="text"
            value={draft.poste ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, poste: e.target.value || null }))}
            placeholder="Meneur, ailier, pivot…"
            className="h-11 rounded-lg border border-anthracite/20 px-3 text-anthracite"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-anthracite/60">
          Contact (parent ou joueur)
          <input
            type="text"
            value={draft.contact_nom ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, contact_nom: e.target.value || null }))}
            className="h-11 rounded-lg border border-anthracite/20 px-3 text-anthracite"
          />
        </label>
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
