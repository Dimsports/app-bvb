import { notFound } from "next/navigation";
import { requireTeamStaff, requireFeature } from "@/lib/auth/guard";
import { getSeanceDetail } from "@/lib/seances/queries";
import { TerrainView } from "./terrain-view";

export default async function TerrainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFeature("mode_terrain");
  const { id } = await params;
  const seance = await getSeanceDetail(id);
  if (!seance) notFound();

  await requireTeamStaff(seance.team_id);

  return <TerrainView seanceId={seance.id} titre={seance.titre} blocs={seance.blocs} />;
}
