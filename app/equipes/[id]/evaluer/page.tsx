import { notFound } from "next/navigation";
import { requireTeamStaff } from "@/lib/auth/guard";
import { getTeamDetail } from "@/lib/teams/queries";
import { getRosterWithCategories } from "@/lib/evaluations/queries";
import { getBvbBook } from "@/lib/competences/queries";
import { teamLabel } from "@/lib/teams/constants";
import { PageHeader } from "@/components/page-header";
import { EvaluationWizard } from "./evaluation-wizard";

export default async function EvaluerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireTeamStaff(id);

  const team = await getTeamDetail(id);
  if (!team) notFound();

  const [roster, domains] = await Promise.all([getRosterWithCategories(id), getBvbBook()]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Évaluer" backHref={`/equipes/${id}`} subtitle={teamLabel(team)} />

      <div className="mt-6">
        <EvaluationWizard teamId={id} roster={roster} domains={domains} />
      </div>
    </main>
  );
}
