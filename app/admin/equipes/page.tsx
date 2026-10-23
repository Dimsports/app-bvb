import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getAllTeams } from "@/lib/teams/queries";
import { teamLabel } from "@/lib/teams/constants";
import { CreateTeamForm } from "./create-team-form";

export default async function AdminEquipesPage() {
  await requireRole("admin");
  const teams = await getAllTeams();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Équipes</h1>
      <p className="mt-1 text-sm text-anthracite/60">
        Catégorie, staff, effectif et créneaux d&apos;entraînement.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        <CreateTeamForm />

        <ul className="flex flex-col gap-3">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/admin/equipes/${team.id}`}
                className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition active:bg-turquoise/10"
              >
                <div>
                  <p className="font-medium text-anthracite">{teamLabel(team)}</p>
                  {team.gymnase && (
                    <p className="text-sm text-anthracite/60">{team.gymnase}</p>
                  )}
                </div>
                <span className="text-anthracite/40">→</span>
              </Link>
            </li>
          ))}
          {teams.length === 0 && (
            <p className="text-sm text-anthracite/60">Aucune équipe pour l&apos;instant.</p>
          )}
        </ul>
      </div>
    </main>
  );
}
