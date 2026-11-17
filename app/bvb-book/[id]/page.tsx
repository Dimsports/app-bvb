import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guard";
import { getCompetence } from "@/lib/competences/queries";
import { getExerciseTitles } from "@/lib/exercises/queries";
import { getThemeFamilies } from "@/lib/themes/queries";
import { getClubSettings } from "@/lib/club/settings";
import { PageHeader } from "@/components/page-header";
import { CompetenceForm } from "../competence-form";
import { DeleteButton } from "./delete-button";
import { LinkManager } from "./link-manager";

export default async function CompetenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAnyRole(["admin", "entraineur", "coach"]);
  const { id } = await params;
  const competence = await getCompetence(id);
  if (!competence) notFound();

  const canEdit = session.roles.includes("admin") || session.roles.includes("entraineur");
  const [domains, clubSettings, linkedExercises] = canEdit
    ? await Promise.all([getThemeFamilies(), getClubSettings(), getExerciseTitles(competence.exerciseIds)])
    : [[], null, []];
  const domainNom = domains.find((d) => d.id === competence.domainId)?.nom;

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title={competence.nom} backHref="/bvb-book" subtitle={domainNom} />

      <div className="mt-6 flex flex-col gap-6">
        {canEdit ? (
          <CompetenceForm
            mode="edit"
            competenceId={competence.id}
            domains={domains}
            clubCategories={clubSettings?.categories ?? []}
            initial={{
              nom: competence.nom,
              domainId: competence.domainId,
              categories: competence.categories,
              description: competence.description ?? "",
              criteres: competence.criteres ?? "",
              exercises: linkedExercises,
            }}
          />
        ) : (
          <section className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-sm">
            {competence.categories.length > 0 && (
              <p className="text-sm text-anthracite/60">{competence.categories.join(" · ")}</p>
            )}
            {competence.description && <p className="text-anthracite">{competence.description}</p>}
            {competence.criteres && (
              <div>
                <p className="text-sm font-medium text-anthracite/70">Critères de réussite</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-anthracite">{competence.criteres}</p>
              </div>
            )}
          </section>
        )}

        {competence.exerciseIds.length > 0 && (
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-title text-xl text-anthracite">Exercices associés</h2>
            <p className="mt-3 text-sm text-anthracite/60">
              <Link href={`/bibliotheque?competence=${competence.id}`} className="text-turquoise-contrast underline">
                Voir ces exercices dans la bibliothèque →
              </Link>
            </p>
          </section>
        )}

        <LinkManager
          competenceId={competence.id}
          canEdit={canEdit}
          mediaType={competence.media_type}
          mediaUrl={competence.media_url}
          mediaPlatform={competence.media_platform}
        />

        {canEdit && <DeleteButton competenceId={competence.id} />}
      </div>
    </main>
  );
}
