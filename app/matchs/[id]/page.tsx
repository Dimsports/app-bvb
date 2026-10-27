import { notFound } from "next/navigation";
import { requireTeamStaff } from "@/lib/auth/guard";
import { getMatchDetail, getConvocationsForMatch, getMissionsForMatch } from "@/lib/matches/queries";
import { teamLabel } from "@/lib/teams/constants";
import { ConvocationsSection } from "./convocations-section";
import { MissionsSection } from "./missions-section";
import { ResultSection } from "./result-section";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) notFound();

  const session = await requireTeamStaff(match.team_id);
  const canEdit = session.roles.includes("admin") || session.roles.includes("entraineur");

  const [convocations, missions] = await Promise.all([
    getConvocationsForMatch(match.id, match.team_id),
    getMissionsForMatch(match.id),
  ]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <p className="text-sm text-anthracite/60">{match.team ? teamLabel(match.team) : ""}</p>
      <h1 className="font-title text-2xl text-anthracite">
        {match.domicile ? "Contre" : "À l'extérieur contre"} {match.adversaire}
      </h1>

      <section className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <p className="capitalize text-anthracite">
          {DATE_FORMAT.format(new Date(`${match.date}T00:00:00`))}
        </p>
        {match.heure && <p className="text-sm text-anthracite/60">{match.heure.slice(0, 5)}</p>}
        {match.salle && <p className="text-sm text-anthracite/60">{match.salle}</p>}
        {match.division && <p className="mt-2 text-xs text-anthracite/40">{match.division}</p>}

        <ResultSection
          matchId={match.id}
          initialScoreBvb={match.score_bvb}
          initialScoreAdversaire={match.score_adversaire}
          initialNoteCoach={match.note_coach}
        />
      </section>

      <div className="mt-6 flex flex-col gap-6">
        <ConvocationsSection matchId={match.id} canEdit={canEdit} initialRows={convocations} />
        <MissionsSection matchId={match.id} canEdit={canEdit} initialMissions={missions} />
      </div>
    </main>
  );
}
