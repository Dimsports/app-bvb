import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getTeamDetail } from "@/lib/teams/queries";
import { teamLabel } from "@/lib/teams/constants";
import { TeamInfoForm } from "./team-info-form";
import { CreneauxSection } from "./creneaux-section";
import { MemberAssignList } from "./member-assign-list";
import {
  searchStaffCandidates,
  searchRosterCandidates,
  addStaff,
  removeStaff,
  addRosterMember,
  removeRosterMember,
} from "../actions";

export default async function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const team = await getTeamDetail(id);
  if (!team) notFound();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">{teamLabel(team)}</h1>

      <div className="mt-6 flex flex-col gap-6">
        <TeamInfoForm team={team} />
        <CreneauxSection teamId={team.id} creneaux={team.creneaux} />
        <MemberAssignList
          teamId={team.id}
          title="Staff"
          emptyLabel="Aucun entraineur ou coach rattaché."
          members={team.staff}
          searchAction={searchStaffCandidates}
          addAction={addStaff}
          removeAction={removeStaff}
        />
        <MemberAssignList
          teamId={team.id}
          title="Effectif"
          emptyLabel="Aucun joueur dans l'effectif."
          members={team.roster}
          searchAction={searchRosterCandidates}
          addAction={addRosterMember}
          removeAction={removeRosterMember}
        />
      </div>
    </main>
  );
}
