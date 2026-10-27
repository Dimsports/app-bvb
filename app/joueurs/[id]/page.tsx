import { notFound } from "next/navigation";
import { requirePlayerAccess } from "@/lib/auth/guard";
import { getPlayerDetail } from "@/lib/players/queries";
import { teamLabel } from "@/lib/teams/constants";
import { PlayerProfileSection } from "./player-profile-section";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerDetail(id);
  if (!player) notFound();

  const session = await requirePlayerAccess(id);
  const canEdit = session.roles.includes("admin") || session.roles.includes("entraineur");

  const presencePercent =
    player.presenceTotal > 0 ? Math.round((player.presenceCount / player.presenceTotal) * 100) : null;

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <p className="text-sm text-anthracite/60">
        {player.teams.map((t) => teamLabel(t)).join(" · ") || "Aucune équipe"}
      </p>
      <h1 className="font-title text-2xl text-anthracite">
        {player.prenom} {player.nom}
      </h1>

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
      </div>
    </main>
  );
}
