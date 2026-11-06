import Link from "next/link";
import { requireSession } from "@/lib/auth/guard";
import { getMemberById } from "@/lib/members/get-member";
import { ROLE_LABELS, isRole } from "@/lib/members/roles";
import { logoutAction } from "@/lib/auth/actions";
import { getSeancesForMember } from "@/lib/seances/queries";
import { getMatchesForMember, getConvocationsForPlayer, getMissionsFeed } from "@/lib/matches/queries";
import { getTodayEntry } from "@/lib/wellbeing/queries";
import { isModuleAllowedForMember } from "@/lib/features/queries";
import { teamLabel } from "@/lib/teams/constants";
import { getServiceClient } from "@/lib/supabase/server";
import { ConvocationCard } from "./convocation-card";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const MATCH_DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default async function AccueilPage() {
  const session = await requireSession();
  const member = await getMemberById(session.memberId);
  const isAdmin = session.roles.includes("admin");
  const isEntraineur = session.roles.includes("entraineur");
  const isCoach = session.roles.includes("coach");
  const isJoueur = session.roles.includes("joueur");
  const isBenevole = session.roles.includes("benevole");

  const seances =
    isEntraineur || isCoach ? await getSeancesForMember(session.memberId, isAdmin) : [];
  const matches =
    isEntraineur || isCoach ? await getMatchesForMember(session.memberId, isAdmin) : [];
  const playerConvocations = isJoueur ? await getConvocationsForPlayer(session.memberId) : [];
  const missionsFeed = isBenevole ? await getMissionsFeed(session.memberId) : [];
  const wellbeingToday = isJoueur ? await getTodayEntry(session.memberId) : null;

  const [canSeances, canMatchs, canQuestionnaires, canBenevoles, canProjetClub, canCommunication] =
    await Promise.all([
      isModuleAllowedForMember("seances", session.memberId, session.roles),
      isModuleAllowedForMember("matchs", session.memberId, session.roles),
      isModuleAllowedForMember("questionnaires", session.memberId, session.roles),
      isModuleAllowedForMember("benevoles", session.memberId, session.roles),
      isModuleAllowedForMember("projet_club", session.memberId, session.roles),
      isModuleAllowedForMember("communication", session.memberId, session.roles),
    ]);

  const today = isoDate();
  const nextMatch = matches.find((m) => m.date >= today) ?? null;
  const pendingConvocations = playerConvocations.filter(
    (c) => c.statut === "en_attente" && c.match.date >= today
  );
  const weekEnd = isoDate(6);
  const todaySeance = seances.find((s) => s.date === today) ?? null;
  const weekSeances = seances.filter((s) => s.date >= today && s.date <= weekEnd);
  const weekReady = weekSeances.filter((s) => s.blocCount > 0).length;
  const weekRemaining = weekSeances.length - weekReady;

  let memberCount = 0;
  let teamCount = 0;
  if (isAdmin) {
    const supabase = getServiceClient();
    const [{ count: mCount }, { count: tCount }] = await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("teams").select("id", { count: "exact", head: true }),
    ]);
    memberCount = mCount ?? 0;
    teamCount = tCount ?? 0;
  }

  const openMissionsCount = missionsFeed.reduce(
    (sum, entry) =>
      sum + entry.missions.filter((m) => !m.estInscrit && m.inscritCount < m.besoin).length,
    0
  );

  const hasRoleContent = isAdmin || isEntraineur || isCoach || isJoueur || isBenevole;

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm capitalize text-anthracite/60">{DATE_FORMAT.format(new Date())}</p>
          <h1 className="font-title text-2xl text-anthracite">
            Bonjour {member ? member.prenom : "…"}
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        {member?.roles.filter(isRole).map((role) => (
          <span
            key={role}
            className="rounded-full bg-turquoise/20 px-3 py-1 text-sm font-medium text-turquoise-contrast"
          >
            {ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {(isEntraineur || isCoach) &&
          canSeances &&
          (todaySeance ? (
            <section className="rounded-2xl bg-turquoise p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-anthracite px-3 py-1 text-xs font-semibold text-white">
                  {todaySeance.team ? teamLabel(todaySeance.team) : ""}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-on-turquoise">
                  Séance du jour
                </span>
              </div>
              <h2 className="mt-2 font-title text-2xl text-on-turquoise">
                {todaySeance.titre || "Séance"}
              </h2>
              <p className="mt-1 text-sm text-on-turquoise">
                {todaySeance.heure_debut ? todaySeance.heure_debut.slice(0, 5) : ""}
                {todaySeance.heure_fin ? `–${todaySeance.heure_fin.slice(0, 5)}` : ""}
                {todaySeance.blocCount > 0 ? ` · ${todaySeance.blocCount} exercices` : ""}
              </p>
              <Link
                href={`/seances/${todaySeance.id}/terrain`}
                className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-anthracite font-medium text-white"
              >
                ▶ Lancer en mode terrain
              </Link>
            </section>
          ) : (
            <section className="rounded-2xl bg-card p-5 shadow-sm">
              <p className="text-sm text-anthracite/60">Pas de séance aujourd&apos;hui.</p>
            </section>
          ))}

        {(isEntraineur || isAdmin) && canSeances && weekSeances.length > 0 && (
          <section className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-anthracite">Séances de la semaine</h2>
              <span className="text-sm font-semibold text-turquoise-contrast">
                {weekReady} / {weekSeances.length} prêtes
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-anthracite/10">
              <div
                className="h-full rounded-full bg-turquoise"
                style={{ width: `${(weekReady / weekSeances.length) * 100}%` }}
              />
            </div>
            {weekRemaining > 0 ? (
              <Link
                href="/seances"
                className="mt-3 inline-block text-sm font-medium text-turquoise-contrast"
              >
                Préparer les {weekRemaining} séance{weekRemaining > 1 ? "s" : ""} restante
                {weekRemaining > 1 ? "s" : ""} →
              </Link>
            ) : (
              <p className="mt-3 text-sm text-anthracite/60">
                Toutes les séances de la semaine sont prêtes.
              </p>
            )}
          </section>
        )}

        {(isEntraineur || isCoach) && canMatchs && nextMatch && (
          <Link
            href={`/matchs/${nextMatch.id}`}
            className="flex items-center gap-3 rounded-2xl bg-card p-5 shadow-sm"
          >
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-anthracite text-white">
              <span className="text-xs font-semibold uppercase text-turquoise">
                {MATCH_DATE_FORMAT.format(new Date(`${nextMatch.date}T00:00:00`)).split(" ")[0]}
              </span>
              <span className="font-title text-xl leading-none">
                {new Date(`${nextMatch.date}T00:00:00`).getDate()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-anthracite/50">
                Prochain match{nextMatch.heure ? ` · ${nextMatch.heure.slice(0, 5)}` : ""}
              </p>
              <p className="truncate font-medium text-anthracite">
                {nextMatch.team ? teamLabel(nextMatch.team) : ""} {nextMatch.domicile ? "vs" : "@"}{" "}
                {nextMatch.adversaire}
              </p>
            </div>
            <span className="shrink-0 text-anthracite/40">→</span>
          </Link>
        )}

        {isAdmin && (
          <section className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="font-medium text-anthracite">Club</h2>
            <p className="mt-1 text-sm text-anthracite/60">
              {memberCount} membre{memberCount > 1 ? "s" : ""} · {teamCount} équipe
              {teamCount > 1 ? "s" : ""}
            </p>
          </section>
        )}

        {isJoueur &&
          (pendingConvocations.length > 0 ? (
            pendingConvocations.map((c) => (
              <ConvocationCard key={c.match.id} convocation={c} />
            ))
          ) : (
            <section className="rounded-2xl bg-card p-5 shadow-sm">
              <p className="text-sm text-anthracite/60">Aucune convocation en attente.</p>
            </section>
          ))}

        {isJoueur && canQuestionnaires && (
          <Link
            href="/bien-etre"
            className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-sm"
          >
            <div>
              <h2 className="font-medium text-anthracite">Bien-être</h2>
              <p className="mt-1 text-sm text-anthracite/60">
                {wellbeingToday ? "Déjà complété aujourd'hui" : "Questionnaire du jour à remplir"}
              </p>
            </div>
            <span className="text-anthracite/40">→</span>
          </Link>
        )}

        {isBenevole && canBenevoles && (
          <Link
            href="/missions"
            className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-sm"
          >
            <div>
              <h2 className="font-medium text-anthracite">Missions bénévoles</h2>
              <p className="mt-1 text-sm text-anthracite/60">
                {openMissionsCount > 0
                  ? `${openMissionsCount} mission${openMissionsCount > 1 ? "s" : ""} à pourvoir`
                  : "Aucun besoin pour l'instant"}
              </p>
            </div>
            <span className="text-anthracite/40">→</span>
          </Link>
        )}

        {!hasRoleContent && (
          <section className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="text-sm text-anthracite/60">Connexion réussie.</p>
          </section>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isAdmin && (
          <Link
            href="/administration"
            className="inline-flex h-12 items-center rounded-xl bg-anthracite px-5 font-medium text-white"
          >
            Administration
          </Link>
        )}
        {(isEntraineur || isCoach) && (
          <>
            <Link
              href="/equipes"
              className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
            >
              Mes équipes
            </Link>
            {canSeances && (
              <Link
                href="/seances"
                className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
              >
                Séances
              </Link>
            )}
            <Link
              href="/bibliotheque"
              className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
            >
              Bibliothèque d&apos;exercices
            </Link>
            {canMatchs && (
              <Link
                href="/matchs"
                className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
              >
                Matchs
              </Link>
            )}
          </>
        )}
        {(isAdmin || isEntraineur) && canProjetClub && (
          <Link
            href="/projet"
            className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
          >
            Projet club
          </Link>
        )}
        {canCommunication && (
          <Link
            href="/annonces"
            className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
          >
            Annonces
          </Link>
        )}
      </div>
    </main>
  );
}
