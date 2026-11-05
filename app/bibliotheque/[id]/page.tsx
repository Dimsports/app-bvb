import { notFound } from "next/navigation";
import { requireAnyRole } from "@/lib/auth/guard";
import { getExercise } from "@/lib/exercises/queries";
import { PARTIE_LABELS, isPartie } from "@/lib/exercises/constants";
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

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title={exercise.titre} backHref="/bibliotheque" />

      <div className="mt-6 flex flex-col gap-6">
        {canEdit ? (
          <ExerciseForm
            mode="edit"
            exerciseId={exercise.id}
            initial={{
              titre: exercise.titre,
              partie: exercise.partie,
              dureeDefautMinutes: exercise.duree_defaut_minutes?.toString() ?? "",
              consignes: exercise.consignes ?? "",
              tags: exercise.tags,
            }}
          />
        ) : (
          <section className="flex flex-col gap-2 rounded-2xl bg-card p-6 shadow-sm">
            <p className="text-sm text-anthracite/60">
              {isPartie(exercise.partie) ? PARTIE_LABELS[exercise.partie] : exercise.partie}
              {exercise.duree_defaut_minutes ? ` · ${exercise.duree_defaut_minutes} min` : ""}
            </p>
            {exercise.consignes && <p className="text-anthracite">{exercise.consignes}</p>}
            {exercise.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {exercise.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-anthracite/5 px-3 py-1 text-sm text-anthracite/70">
                    {tag}
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
