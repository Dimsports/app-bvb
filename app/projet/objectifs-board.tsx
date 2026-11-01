"use client";

import { useState, useTransition } from "react";
import type { ActionStatut, ProjetAction, ProjetObjectif } from "@/lib/projet/queries";
import { createObjectif, deleteObjectif, createAction, updateActionStatut, deleteAction } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

const STATUT_LABELS: Record<ActionStatut, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  fait: "Fait",
};

type Member = { id: string; prenom: string; nom: string };

function ActionRow({
  action,
  onDelete,
}: {
  action: ProjetAction;
  onDelete: (actionId: string) => void;
}) {
  const [statut, setStatut] = useState(action.statut);
  const [isPending, startTransition] = useTransition();

  function handleStatutChange(next: ActionStatut) {
    setStatut(next);
    startTransition(() => {
      updateActionStatut(action.id, next);
    });
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg bg-anthracite/5 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${statut === "fait" ? "text-anthracite/40 line-through" : "text-anthracite"}`}>
          {action.titre}
        </p>
        <p className="text-xs text-anthracite/50">
          {action.responsable ? `${action.responsable.prenom} ${action.responsable.nom}` : "Non assigné"}
          {action.echeance ? ` · ${DATE_FORMAT.format(new Date(`${action.echeance}T00:00:00`))}` : ""}
        </p>
      </div>
      <select
        value={statut}
        disabled={isPending}
        onChange={(e) => handleStatutChange(e.target.value as ActionStatut)}
        className="h-9 shrink-0 rounded-lg border border-anthracite/20 bg-background px-2 text-xs text-anthracite"
      >
        {(Object.keys(STATUT_LABELS) as ActionStatut[]).map((s) => (
          <option key={s} value={s}>
            {STATUT_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onDelete(action.id)}
        className="shrink-0 text-xs text-anthracite/40 hover:text-anthracite"
      >
        Supprimer
      </button>
    </li>
  );
}

function ObjectifCard({
  objectif,
  members,
  onDeleteObjectif,
}: {
  objectif: ProjetObjectif;
  members: Member[];
  onDeleteObjectif: (objectifId: string) => void;
}) {
  const [actions, setActions] = useState(objectif.actions);
  const [addingAction, setAddingAction] = useState(false);
  const [titre, setTitre] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [echeance, setEcheance] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAddAction() {
    const cleanTitre = titre.trim();
    if (!cleanTitre) return;
    const responsable = members.find((m) => m.id === responsableId) ?? null;

    setActions((prev) => [
      ...prev,
      {
        id: `local-${crypto.randomUUID()}`,
        objectif_id: objectif.id,
        titre: cleanTitre,
        echeance: echeance || null,
        statut: "a_faire",
        responsable,
      },
    ]);
    setTitre("");
    setResponsableId("");
    setEcheance("");
    setAddingAction(false);

    startTransition(() => {
      createAction(objectif.id, { titre: cleanTitre, responsableId, echeance });
    });
  }

  function handleDeleteAction(actionId: string) {
    setActions((prev) => prev.filter((a) => a.id !== actionId));
    startTransition(() => {
      deleteAction(actionId);
    });
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-title text-xl text-anthracite">{objectif.titre}</h2>
          {objectif.description && <p className="mt-1 text-sm text-anthracite/60">{objectif.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDeleteObjectif(objectif.id)}
          className="shrink-0 text-xs text-anthracite/40 hover:text-anthracite"
        >
          Supprimer
        </button>
      </div>

      {actions.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {actions.map((a) => (
            <ActionRow key={a.id} action={a} onDelete={handleDeleteAction} />
          ))}
        </ul>
      )}

      {addingAction ? (
        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-anthracite/5 p-3">
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Nom de l'action"
            className="h-10 rounded-lg border border-anthracite/20 px-3 text-sm text-anthracite"
          />
          <div className="flex gap-2">
            <select
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              className="h-10 flex-1 rounded-lg border border-anthracite/20 px-2 text-sm text-anthracite"
            >
              <option value="">Non assigné</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.prenom} {m.nom}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={echeance}
              onChange={(e) => setEcheance(e.target.value)}
              className="h-10 rounded-lg border border-anthracite/20 px-2 text-sm text-anthracite"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending || !titre.trim()}
              onClick={handleAddAction}
              className="h-9 rounded-lg bg-anthracite px-3 text-xs font-medium text-white disabled:opacity-40"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setAddingAction(false)}
              className="h-9 rounded-lg border border-anthracite/20 px-3 text-xs font-medium text-anthracite"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingAction(true)}
          className="mt-3 text-sm font-medium text-turquoise-contrast"
        >
          + Ajouter une action
        </button>
      )}
    </section>
  );
}

export function ObjectifsBoard({
  initialObjectifs,
  members,
}: {
  initialObjectifs: ProjetObjectif[];
  members: Member[];
}) {
  const [objectifs, setObjectifs] = useState(initialObjectifs);
  const [addingObjectif, setAddingObjectif] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddObjectif() {
    const cleanTitre = titre.trim();
    if (!cleanTitre) return;
    setError(null);

    setObjectifs((prev) => [
      ...prev,
      { id: `local-${crypto.randomUUID()}`, titre: cleanTitre, description: description.trim() || null, actions: [] },
    ]);
    setTitre("");
    setDescription("");
    setAddingObjectif(false);

    startTransition(async () => {
      const result = await createObjectif(cleanTitre, description);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDeleteObjectif(objectifId: string) {
    setObjectifs((prev) => prev.filter((o) => o.id !== objectifId));
    startTransition(() => {
      deleteObjectif(objectifId);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {addingObjectif ? (
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="font-title text-xl text-anthracite">Nouvel objectif</h2>
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex. Renouveler le parc de ballons"
              className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm text-anthracite"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (facultatif)"
              rows={2}
              className="rounded-lg border border-anthracite/20 p-3 text-sm text-anthracite"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending || !titre.trim()}
                onClick={handleAddObjectif}
                className="h-10 rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-40"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setAddingObjectif(false)}
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
          onClick={() => setAddingObjectif(true)}
          className="h-12 self-start rounded-xl bg-anthracite px-5 font-medium text-white"
        >
          + Nouvel objectif
        </button>
      )}

      {objectifs.map((o) => (
        <ObjectifCard key={o.id} objectif={o} members={members} onDeleteObjectif={handleDeleteObjectif} />
      ))}

      {objectifs.length === 0 && (
        <p className="text-sm text-anthracite/50">Aucun objectif pour l&apos;instant.</p>
      )}
    </div>
  );
}
