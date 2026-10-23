import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guard";
import { getTeamsForMember } from "@/lib/teams/queries";
import { teamLabel } from "@/lib/teams/constants";

export default async function MesEquipesPage() {
  const session = await requireAnyRole(["entraineur", "coach"]);
  const teams = await getTeamsForMember(session.memberId);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Mes équipes</h1>

      <ul className="mt-6 flex flex-col gap-3">
        {teams.map((team) => (
          <li key={team.id}>
            <Link
              href={`/equipes/${team.id}`}
              className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition active:bg-turquoise/10"
            >
              <div>
                <p className="font-medium text-anthracite">{teamLabel(team)}</p>
                {team.gymnase && <p className="text-sm text-anthracite/60">{team.gymnase}</p>}
              </div>
              <span className="text-anthracite/40">→</span>
            </Link>
          </li>
        ))}
        {teams.length === 0 && (
          <p className="text-sm text-anthracite/60">
            Aucune équipe ne vous est rattachée pour l&apos;instant.
          </p>
        )}
      </ul>
    </main>
  );
}
