import { notFound } from "next/navigation";
import { requireTeamStaff } from "@/lib/auth/guard";
import { getSeanceDetail, getSeancePresences } from "@/lib/seances/queries";
import { getTeamRoster } from "@/lib/teams/queries";
import { teamLabel } from "@/lib/teams/constants";
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
  const { id } = await params;
  const seance = await getSeanceDetail(id);
  if (!seance) notFound();

  await requireTeamStaff(seance.team_id);

  const [roster, presentIds] = await Promise.all([
    getTeamRoster(seance.team_id),
    getSeancePresences(seance.id),
  ]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <p className="text-sm text-anthracite/60">{seance.team ? teamLabel(seance.team) : ""}</p>
      <h1 className="font-title text-2xl capitalize text-anthracite">
        Appel — {DATE_FORMAT.format(new Date(`${seance.date}T00:00:00`))}
      </h1>

      <div className="mt-6">
        <AppelView seanceId={seance.id} roster={roster} initialPresentIds={[...presentIds]} />
      </div>
    </main>
  );
}
