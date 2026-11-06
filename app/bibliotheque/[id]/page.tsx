import { notFound } from "next/navigation";
import { requireAnyRole } from "@/lib/auth/guard";
import { getExercise } from "@/lib/exercises/queries";
import {
  PARTIE_LABELS,
  isPartie,
  ESPACE_LABELS,
  isEspace,
  INTENSITE_LABELS,
  isIntensite,
  OPPOSITION_LABELS,
  isOpposition,
} from "@/lib/exercises/constants";
import { getThemeFamilies } from "@/lib/themes/queries";
import { getClubSettings } from "@/lib/club/settings";
import { PageHeader } from "@/components/page-header";
import { ExerciseForm } from "../exercise-form";
import { MediaManager } from "./media-manager";
import { DeleteButton } from "./delete-button";

export default async function ExerciceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAnyRole(["entraineur", "coach"]);
  const { id } = await params;
  const exercise = await getExercise(id);
  if (!exercise) notFound();

  const canEdit = session.roles.includes("admin") || session.roles.includes("entraineur");
  const [themeFamilies, clubSettings] = canEdit
    ? await Promise.all([getThemeFamilies(), getClubSettings()])
    : [[], null];

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title={exercise.titre} backHref="/bibliotheque" />

      <div className="mt-6 flex flex-col gap-6">
        {canEdit ? (
          <ExerciseForm
            mode="edit"
            exerciseId={exercise.id}
            themeFamilies={themeFamilies}
            clubCategories={clubSettings?.categories ?? []}
            initial={{
              titre: exercise.titre,
              partie: exercise.partie,
              dureeDefautMinutes: exercise.duree_defaut_minutes?.toString() ?? "",
              consignes: exercise.consignes ?? "",
              themeIds: exercise.themes.map((t) => t.id),
              categories: exercise.categories,
              nbJoueursMin: exercise.nb_joueurs_min?.toString() ?? "",
              nbJoueursMax: exercise.nb_joueurs_max?.toString() ?? "",
              espace: exercise.espace ?? "",
              materiel: exercise.materiel,
              intensite: exercise.intensite ?? "",
              opposition: exercise.opposition ?? "",
            }}
          />
        ) : (
          <section className="flex flex-col gap-2 rounded-2xl bg-card p-6 shadow-sm">
            <p className="text-sm text-anthracite/60">
              {isPartie(exercise.partie) ? PARTIE_LABELS[exercise.partie] : exercise.partie}
              {exercise.duree_defaut_minutes ? ` · ${exercise.duree_defaut_minutes} min` : ""}
              {exercise.espace && isEspace(exercise.espace) ? ` · ${ESPACE_LABELS[exercise.espace]}` : ""}
              {exercise.intensite && isIntensite(exercise.intensite)
                ? ` · ${INTENSITE_LABELS[exercise.intensite]}`
                : ""}
              {exercise.opposition && isOpposition(exercise.opposition)
                ? ` · ${OPPOSITION_LABELS[exercise.opposition]}`
                : ""}
              {exercise.nb_joueurs_min || exercise.nb_joueurs_max
                ? ` · ${exercise.nb_joueurs_min ?? "?"}-${exercise.nb_joueurs_max ?? "?"} joueurs`
                : ""}
            </p>
            {exercise.consignes && <p className="text-anthracite">{exercise.consignes}</p>}
            {(exercise.themes.length > 0 || exercise.categories.length > 0 || exercise.materiel.length > 0) && (
              <div className="mt-1 flex flex-wrap gap-2">
                {exercise.themes.map((theme) => (
                  <span
                    key={theme.id}
                    className="rounded-full bg-turquoise/15 px-3 py-1 text-sm text-turquoise-contrast"
                  >
                    {theme.nom}
                  </span>
                ))}
                {exercise.categories.map((cat) => (
                  <span key={cat} className="rounded-full bg-anthracite/10 px-3 py-1 text-sm text-anthracite/70">
                    {cat}
                  </span>
                ))}
                {exercise.materiel.map((item) => (
                  <span key={item} className="rounded-full bg-anthracite/5 px-3 py-1 text-sm text-anthracite/70">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        <MediaManager
          exerciseId={exercise.id}
          canEdit={canEdit}
          mediaType={exercise.media_type}
          mediaUrl={exercise.media_url}
          mediaPlatform={exercise.media_platform}
        />

        {canEdit && <DeleteButton exerciseId={exercise.id} />}
      </div>
    </main>
  );
}
