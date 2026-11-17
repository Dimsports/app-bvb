import { notFound } from "next/navigation";
import { requirePlayerAccess, requireFeature } from "@/lib/auth/guard";
import { getPlayerDetail } from "@/lib/players/queries";
import { getRecentEntries } from "@/lib/wellbeing/queries";
import { getNotesForPlayer } from "@/lib/notes/queries";
import { getEvaluationsForPlayer } from "@/lib/evaluations/queries";
import { NIVEAU_COLOR_VAR, isNiveau } from "@/lib/competences/constants";
import { teamLabel } from "@/lib/teams/constants";
import { PageHeader } from "@/components/page-header";
import { PlayerProfileSection } from "./player-profile-section";
import { PlayerNotesSection } from "./player-notes-section";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFeature("joueurs");
  const { id } = await params;
  const player = await getPlayerDetail(id);
  if (!player) notFound();

  const session = await requirePlayerAccess(id);
  const canEdit = session.roles.includes("admin") || session.roles.includes("entraineur");
  const canSeeWellbeing = canEdit;

  const presencePercent =
    player.presenceTotal > 0 ? Math.round((player.presenceCount / player.presenceTotal) * 100) : null;
  const wellbeingEntries = canSeeWellbeing ? await getRecentEntries(player.id, 7) : [];
  const notes = await getNotesForPlayer(player.id);
  const evaluations = await getEvaluationsForPlayer(player.id);
  const latestEvaluation = evaluations[0] ?? null;
  const pointsForts = latestEvaluation
    ? latestEvaluation.items.filter((it) => it.niveau === "acquis" || it.niveau === "maitrise")
    : [];
  const axesTravail = latestEvaluation
    ? latestEvaluation.items.filter((it) => it.niveau === "non_acquis" || it.niveau === "en_cours")
    : [];

  const backHref = player.teams[0] ? `/equipes/${player.teams[0].id}` : "/equipes";

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader
        title={`${player.prenom} ${player.nom}`}
        backHref={backHref}
        subtitle={player.teams.map((t) => teamLabel(t)).join(" · ") || "Aucune équipe"}
      />

      <div className="mt-6 flex flex-col gap-6">
        <PlayerProfileSection playerId={player.id} canEdit={canEdit} initialProfile={player.profile} />

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="font-title text-xl text-anthracite">Présences</h2>
            {presencePercent !== null && (
              <span className="text-sm font-semibold text-turquoise-contrast">
                {player.presenceCount} / {player.presenceTotal} ({presencePercent}%)
              </span>
            )}
          </div>

          {player.recentPresences.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {player.recentPresences.map((p) => (
                <li
                  key={p.seanceId}
                  className="flex items-center justify-between gap-2 rounded-lg bg-anthracite/5 px-3 py-2 text-sm"
                >
                  <span className="text-anthracite">
                    {DATE_FORMAT.format(new Date(`${p.date}T00:00:00`))}
                    {p.titre ? ` · ${p.titre}` : ""}
                  </span>
                  <span className={p.present ? "font-medium text-turquoise-contrast" : "text-anthracite/40"}>
                    {p.present ? "Présent" : "Absent"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-anthracite/50">Aucune séance passée pour l&apos;instant.</p>
          )}
        </section>

        <PlayerNotesSection
          playerId={player.id}
          currentMemberId={session.memberId}
          canDeleteAny={canEdit}
          initialNotes={notes}
        />

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="font-title text-xl text-anthracite">Évaluations</h2>
          <p className="mt-1 text-xs text-anthracite/40">
            Visible uniquement par le staff de l&apos;équipe et l&apos;admin.
          </p>

          {latestEvaluation ? (
            <>
              <p className="mt-3 text-sm font-medium text-anthracite/70">
                Dernière évaluation — {latestEvaluation.periode} (
                {DATE_FORMAT.format(new Date(`${latestEvaluation.date}T00:00:00`))})
                {latestEvaluation.auteur ? ` · ${latestEvaluation.auteur.prenom} ${latestEvaluation.auteur.nom}` : ""}
              </p>

              {pointsForts.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-anthracite/50">Points forts</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {pointsForts.map((it) => (
                      <span
                        key={it.competenceId}
                        className="rounded-full px-3 py-1 text-sm text-white"
                        style={{ backgroundColor: isNiveau(it.niveau) ? NIVEAU_COLOR_VAR[it.niveau] : undefined }}
                      >
                        {it.competenceNom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {axesTravail.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-anthracite/50">Axes de travail</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {axesTravail.map((it) => (
                      <span
                        key={it.competenceId}
                        className="rounded-full px-3 py-1 text-sm text-white"
                        style={{ backgroundColor: isNiveau(it.niveau) ? NIVEAU_COLOR_VAR[it.niveau] : undefined }}
                      >
                        {it.competenceNom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {latestEvaluation.commentaireGeneral && (
                <p className="mt-2 text-sm text-anthracite">{latestEvaluation.commentaireGeneral}</p>
              )}

              {evaluations.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-anthracite/50">Historique</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {evaluations.slice(1).map((ev) => (
                      <li key={ev.id} className="text-sm text-anthracite/60">
                        {ev.periode} — {DATE_FORMAT.format(new Date(`${ev.date}T00:00:00`))}
                        {ev.auteur ? ` · ${ev.auteur.prenom} ${ev.auteur.nom}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-anthracite/50">Aucune évaluation pour l&apos;instant.</p>
          )}
        </section>

        {canSeeWellbeing && (
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-title text-xl text-anthracite">Bien-être</h2>
            <p className="mt-1 text-xs text-anthracite/40">
              Donnée de santé, visible uniquement par les entraineurs et l&apos;admin.
            </p>

            {wellbeingEntries.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {wellbeingEntries.map((w) => (
                  <li key={w.id} className="rounded-lg bg-anthracite/5 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-anthracite">
                        {DATE_FORMAT.format(new Date(`${w.date}T00:00:00`))}
                      </span>
                      <span className="text-anthracite/60">
                        Sommeil {w.sommeil} · Forme {w.forme} · Courbatures {w.courbatures} · Moral{" "}
                        {w.moral}
                      </span>
                    </div>
                    {w.commentaire && <p className="mt-1 text-anthracite/70">{w.commentaire}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-anthracite/50">Aucune réponse pour l&apos;instant.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
