import { notFound } from "next/navigation";
import { requireTeamStaff, requireFeature } from "@/lib/auth/guard";
import { getSeanceDetail, getSeancePresences } from "@/lib/seances/queries";
import { getTeamRoster } from "@/lib/teams/queries";
import { teamLabel } from "@/lib/teams/constants";
import { PageHeader } from "@/components/page-header";
import { AppelView } from "./appel-view";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function AppelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFeature("seances");
  const { id } = await params;
  const seance = await getSeanceDetail(id);
  if (!seance) notFound();

  await requireTeamStaff(seance.team_id);

  const [roster, presentIds] = await Promise.all([
    getTeamRoster(seance.team_id),
    getSeancePresences(seance.id),
  ]);

  const dateLabel = DATE_FORMAT.format(new Date(`${seance.date}T00:00:00`));

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader
        title={`Appel — ${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}`}
        backHref={`/seances/${seance.id}`}
        subtitle={seance.team ? teamLabel(seance.team) : null}
      />

      <div className="mt-6">
        <AppelView seanceId={seance.id} roster={roster} initialPresentIds={[...presentIds]} />
      </div>
    </main>
  );
}
