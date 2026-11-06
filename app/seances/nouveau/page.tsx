import { requireRole, requireFeature } from "@/lib/auth/guard";
import { getAllTeams, getTeamsForMember } from "@/lib/teams/queries";
import { getCycleOptionsForTeams } from "@/lib/cycles/queries";
import { PageHeader } from "@/components/page-header";
import { CreateSeanceForm } from "./create-seance-form";

export default async function NouvelleSeancePage() {
  await requireFeature("seances");
  const session = await requireRole("entraineur");
  const isAdmin = session.roles.includes("admin");
  const teams = isAdmin ? await getAllTeams() : await getTeamsForMember(session.memberId);
  const cycles = await getCycleOptionsForTeams(teams.map((t) => t.id));

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Nouvelle séance" backHref="/seances" />
      <div className="mt-6">
        <CreateSeanceForm teams={teams} cycles={cycles} />
      </div>
    </main>
  );
}
