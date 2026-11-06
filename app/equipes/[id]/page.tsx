import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guard";
import { getTeamDetail, isTeamStaff } from "@/lib/teams/queries";
import { getCyclesForTeam } from "@/lib/cycles/queries";
import { isModuleAllowedForMember } from "@/lib/features/queries";
import { teamLabel, jourLabel } from "@/lib/teams/constants";
import { PageHeader } from "@/components/page-header";
import { CyclesSection } from "./cycles-section";

export default async function MonEquipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAnyRole(["entraineur", "coach"]);
  const { id } = await params;

  const isAdmin = session.roles.includes("admin");
  if (!isAdmin && !(await isTeamStaff(id, session.memberId))) {
    redirect("/equipes");
  }

  const team = await getTeamDetail(id);
  if (!team) notFound();

  const canEdit = isAdmin || session.roles.includes("entraineur");
  const showSaison = await isModuleAllowedForMember("saison", session.memberId, session.roles);
  const cycles = showSaison ? await getCyclesForTeam(id) : [];

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title={teamLabel(team)} backHref="/equipes" subtitle={team.gymnase} />

      <div className="mt-6 flex flex-col gap-6">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="font-title text-xl text-anthracite">Créneaux d&apos;entraînement</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {team.creneaux.map((c) => (
              <li key={c.id} className="text-sm text-anthracite">
                {jourLabel(c.jour)} {c.heure_debut.slice(0, 5)}–{c.heure_fin.slice(0, 5)}
                {c.lieu ? ` · ${c.lieu}` : ""}
              </li>
            ))}
            {team.creneaux.length === 0 && (
              <p className="text-sm text-anthracite/50">Aucun créneau pour l&apos;instant.</p>
            )}
          </ul>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="font-title text-xl text-anthracite">Staff</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {team.staff.map((m) => (
              <li key={m.id} className="text-sm text-anthracite">
                {m.prenom} {m.nom}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="font-title text-xl text-anthracite">Effectif</h2>
            <span className="text-sm text-anthracite/60">{team.roster.length}</span>
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {team.roster.map((m) => (
              <li key={m.id} className="text-sm">
                <Link href={`/joueurs/${m.id}`} className="text-anthracite hover:underline">
                  {m.prenom} {m.nom}
                </Link>
              </li>
            ))}
            {team.roster.length === 0 && (
              <p className="text-sm text-anthracite/50">Aucun joueur dans l&apos;effectif.</p>
            )}
          </ul>
        </section>

        {showSaison && (
          <CyclesSection teamId={team.id} canEdit={canEdit} initialCycles={cycles} />
        )}
      </div>
    </main>
  );
}
