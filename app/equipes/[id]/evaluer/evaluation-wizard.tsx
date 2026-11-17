"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RosterPlayer } from "@/lib/evaluations/queries";
import type { CompetenceDomainGroup } from "@/lib/competences/queries";
import { NIVEAUX, NIVEAU_LABELS, NIVEAU_COLOR_VAR, type Niveau } from "@/lib/competences/constants";
import { createEvaluation } from "./actions";

type ItemState = { niveau: Niveau | null; commentaire: string };

function defaultPeriode(): string {
  const now = new Date();
  const mois = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(now);
  return `${mois.charAt(0).toUpperCase()}${mois.slice(1)} ${now.getFullYear()}`;
}

export function EvaluationWizard({
  teamId,
  roster,
  domains,
}: {
  teamId: string;
  roster: RosterPlayer[];
  domains: CompetenceDomainGroup[];
}) {
  const [step, setStep] = useState<"selection" | "grading" | "done">("selection");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [periode, setPeriode] = useState(defaultPeriode());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<Record<string, ItemState>>({});
  const [commentaireGeneral, setCommentaireGeneral] = useState("");
  const [evaluatedCount, setEvaluatedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentPlayer = roster.find((p) => p.id === selectedIds[currentIndex]) ?? null;

  const relevantDomains = useMemo(() => {
    if (!currentPlayer) return [];
    if (!currentPlayer.categorie) return domains;
    return domains
      .map((d) => ({ ...d, competences: d.competences.filter((c) => c.categories.includes(currentPlayer.categorie!)) }))
      .filter((d) => d.competences.length > 0);
  }, [currentPlayer, domains]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function startGrading() {
    setItems({});
    setCommentaireGeneral("");
    setCurrentIndex(0);
    setEvaluatedCount(0);
    setStep("grading");
  }

  function setNiveau(competenceId: string, niveau: Niveau) {
    setItems((prev) => ({ ...prev, [competenceId]: { niveau, commentaire: prev[competenceId]?.commentaire ?? "" } }));
  }

  function setCommentaire(competenceId: string, commentaire: string) {
    setItems((prev) => ({ ...prev, [competenceId]: { niveau: prev[competenceId]?.niveau ?? null, commentaire } }));
  }

  function advanceOrFinish() {
    if (currentIndex + 1 < selectedIds.length) {
      setItems({});
      setCommentaireGeneral("");
      setCurrentIndex((i) => i + 1);
    } else {
      setStep("done");
      router.refresh();
    }
  }

  function handleNext() {
    if (!currentPlayer) return;
    const graded = Object.entries(items).filter(([, v]) => v.niveau);
    const hasGradableCompetences = relevantDomains.some((d) => d.competences.length > 0);

    if (hasGradableCompetences && graded.length === 0) {
      setError("Évaluez au moins une compétence avant de continuer.");
      return;
    }
    setError(null);

    if (graded.length === 0) {
      // Rien à enregistrer pour ce joueur (aucune compétence pour sa
      // catégorie) : on passe au suivant sans créer d'évaluation vide.
      advanceOrFinish();
      return;
    }

    startTransition(async () => {
      const result = await createEvaluation(teamId, {
        playerId: currentPlayer.id,
        periode,
        items: graded.map(([competenceId, v]) => ({
          competenceId,
          niveau: v.niveau as string,
          commentaire: v.commentaire,
        })),
        commentaireGeneral,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEvaluatedCount((n) => n + 1);
      advanceOrFinish();
    });
  }

  if (step === "done") {
    return (
      <section className="rounded-2xl bg-card p-6 text-center shadow-sm">
        <p className="font-title text-xl text-anthracite">Évaluations enregistrées</p>
        <p className="mt-2 text-sm text-anthracite/60">
          {evaluatedCount} joueur{evaluatedCount > 1 ? "s" : ""} évalué{evaluatedCount > 1 ? "s" : ""} pour la
          période « {periode} »
          {evaluatedCount < selectedIds.length
            ? ` (${selectedIds.length - evaluatedCount} sans compétence pour sa/leur catégorie)`
            : ""}
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setSelectedIds([]);
            setStep("selection");
          }}
          className="mt-4 h-12 rounded-xl bg-anthracite px-5 font-medium text-white"
        >
          Nouvelle évaluation
        </button>
      </section>
    );
  }

  if (step === "selection") {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-anthracite/60">Période</span>
          <input
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="h-12 rounded-lg border border-anthracite/20 px-3"
          />
        </label>

        <p className="mt-4 text-sm font-medium text-anthracite/70">Joueurs à évaluer</p>
        <ul className="mt-2 flex flex-col gap-2">
          {roster.map((p) => (
            <li key={p.id}>
              <label className="flex items-center gap-3 rounded-lg bg-anthracite/5 p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleSelected(p.id)}
                  className="h-5 w-5"
                />
                <span className="text-anthracite">
                  {p.prenom} {p.nom}
                </span>
                {p.categorie && <span className="ml-auto text-xs text-anthracite/50">{p.categorie}</span>}
              </label>
            </li>
          ))}
          {roster.length === 0 && <p className="text-sm text-anthracite/50">Aucun joueur dans l&apos;effectif.</p>}
        </ul>

        <button
          type="button"
          disabled={selectedIds.length === 0 || !periode.trim()}
          onClick={startGrading}
          className="mt-4 h-12 w-full rounded-xl bg-anthracite font-medium text-white disabled:opacity-40"
        >
          Commencer l&apos;évaluation ({selectedIds.length})
        </button>
      </section>
    );
  }

  if (!currentPlayer) return null;

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-title text-xl text-anthracite">
          {currentPlayer.prenom} {currentPlayer.nom}
        </h2>
        <span className="text-sm text-anthracite/60">
          {currentIndex + 1} / {selectedIds.length}
        </span>
      </div>
      {currentPlayer.categorie && <p className="text-sm text-anthracite/50">{currentPlayer.categorie}</p>}

      <div className="mt-4 flex flex-col gap-5">
        {relevantDomains.map((domain) => (
          <div key={domain.domainId}>
            <p className="text-sm font-medium text-anthracite/70">{domain.domainNom}</p>
            <div className="mt-2 flex flex-col gap-3">
              {domain.competences.map((c) => {
                const state = items[c.id];
                return (
                  <div key={c.id} className="rounded-lg bg-anthracite/5 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-anthracite">{c.nom}</p>
                      <Link
                        href={`/bibliotheque?competence=${c.id}`}
                        target="_blank"
                        className="shrink-0 text-xs text-turquoise-contrast underline"
                      >
                        Trouver des exercices
                      </Link>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {NIVEAUX.map((niveau) => (
                        <button
                          key={niveau}
                          type="button"
                          onClick={() => setNiveau(c.id, niveau)}
                          style={
                            state?.niveau === niveau
                              ? { backgroundColor: NIVEAU_COLOR_VAR[niveau], color: "white" }
                              : undefined
                          }
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            state?.niveau === niveau ? "border-transparent" : "border-anthracite/20 text-anthracite"
                          }`}
                        >
                          {NIVEAU_LABELS[niveau]}
                        </button>
                      ))}
                    </div>
                    <input
                      value={state?.commentaire ?? ""}
                      onChange={(e) => setCommentaire(c.id, e.target.value)}
                      placeholder="Commentaire (facultatif)"
                      className="mt-2 h-9 w-full rounded-lg border border-anthracite/20 px-2 text-sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {relevantDomains.length === 0 && (
          <p className="text-sm text-anthracite/50">Aucune compétence pour cette catégorie.</p>
        )}
      </div>

      <label className="mt-5 flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Commentaire général</span>
        <textarea
          value={commentaireGeneral}
          onChange={(e) => setCommentaireGeneral(e.target.value)}
          rows={3}
          className="rounded-lg border border-anthracite/20 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleNext}
        className="mt-4 h-12 w-full rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending
          ? "Enregistrement…"
          : currentIndex + 1 < selectedIds.length
            ? "Joueur suivant →"
            : "Terminer"}
      </button>
    </section>
  );
}
