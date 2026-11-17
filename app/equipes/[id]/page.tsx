import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guard";
import { getTeamDetail, isTeamStaff } from "@/lib/teams/queries";
import { getCyclesForTeam } from "@/lib/cycles/queries";
import { getTeamEvaluationMatrix } from "@/lib/evaluations/queries";
import { isModuleAllowedForMember } from "@/lib/features/queries";
import { isNiveau, NIVEAU_COLOR_VAR, NIVEAU_LABELS } from "@/lib/competences/constants";
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
  const [cycles, evaluationMatrix] = await Promise.all([
    showSaison ? getCyclesForTeam(id) : Promise.resolve([]),
    getTeamEvaluationMatrix(id, team.categorie),
  ]);
  const matrixCompetences = evaluationMatrix.domains.flatMap((d) => d.competences);

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
          {team.roster.length > 0 && (
            <Link
              href={`/equipes/${team.id}/evaluer`}
              className="mt-3 inline-flex h-11 items-center rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
            >
              Évaluer
            </Link>
          )}
        </section>

        {team.roster.length > 0 && matrixCompetences.length > 0 && (
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-title text-xl text-anthracite">Évaluations</h2>
            <p className="mt-1 text-xs text-anthracite/40">
              Dernier niveau connu par joueur et par compétence ({team.categorie}).
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-1 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-card px-2 py-1 text-left font-medium text-anthracite/60">
                      Joueur
                    </th>
                    {matrixCompetences.map((c) => (
                      <th
                        key={c.id}
                        title={c.nom}
                        className="min-w-[72px] px-2 py-1 text-center text-xs font-normal text-anthracite/50"
                      >
                        {c.nom.length > 14 ? `${c.nom.slice(0, 14)}…` : c.nom}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluationMatrix.players.map((p) => (
                    <tr key={p.id}>
                      <td className="sticky left-0 whitespace-nowrap bg-card px-2 py-1 font-medium text-anthracite">
                        {p.prenom} {p.nom}
                      </td>
                      {matrixCompetences.map((c) => {
                        const niveau = evaluationMatrix.cells[`${p.id}:${c.id}`];
                        return (
                          <td key={c.id} className="px-2 py-1 text-center">
                            <span
                              title={niveau && isNiveau(niveau) ? NIVEAU_LABELS[niveau] : "Non évalué"}
                              className="inline-block h-3 w-3 rounded-full"
                              style={{
                                backgroundColor:
                                  niveau && isNiveau(niveau) ? NIVEAU_COLOR_VAR[niveau] : "var(--color-dot-empty)",
                                opacity: niveau ? 1 : 0.3,
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showSaison && (
          <CyclesSection teamId={team.id} canEdit={canEdit} initialCycles={cycles} />
        )}
      </div>
    </main>
  );
}
