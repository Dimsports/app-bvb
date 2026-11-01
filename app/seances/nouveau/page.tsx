import { requireRole } from "@/lib/auth/guard";
import { getAllTeams, getTeamsForMember } from "@/lib/teams/queries";
import { getCycleOptionsForTeams } from "@/lib/cycles/queries";
import { CreateSeanceForm } from "./create-seance-form";

export default async function NouvelleSeancePage() {
  const session = await requireRole("entraineur");
  const isAdmin = session.roles.includes("admin");
  const teams = isAdmin ? await getAllTeams() : await getTeamsForMember(session.memberId);
  const cycles = await getCycleOptionsForTeams(teams.map((t) => t.id));

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Nouvelle séance</h1>
      <div className="mt-6">
        <CreateSeanceForm teams={teams} cycles={cycles} />
      </div>
    </main>
  );
}
