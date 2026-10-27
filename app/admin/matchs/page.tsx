import { requireRole } from "@/lib/auth/guard";
import { getAllMatches } from "@/lib/matches/queries";
import { getAllTeams } from "@/lib/teams/queries";
import { teamLabel } from "@/lib/teams/constants";
import { ImportForm } from "./import-form";
import { DeleteMatchButton } from "./delete-match-button";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export default async function AdminMatchsPage() {
  await requireRole("admin");

  const [matches, teams] = await Promise.all([getAllMatches(), getAllTeams()]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Matchs</h1>

      <div className="mt-6 flex flex-col gap-6">
        <ImportForm teams={teams} />

        <ul className="flex flex-col gap-2">
          {matches.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-anthracite">
                  {DATE_FORMAT.format(new Date(`${m.date}T00:00:00`))}
                  {m.heure ? ` · ${m.heure.slice(0, 5)}` : ""} — {m.domicile ? "vs" : "@"}{" "}
                  {m.adversaire}
                </p>
                <p className="text-sm text-anthracite/60">
                  {m.team ? teamLabel(m.team) : ""}
                  {m.salle ? ` · ${m.salle}` : ""}
                  {m.score_bvb !== null && m.score_adversaire !== null
                    ? ` · ${m.score_bvb}-${m.score_adversaire}`
                    : ""}
                </p>
              </div>
              <DeleteMatchButton matchId={m.id} />
            </li>
          ))}
          {matches.length === 0 && (
            <p className="text-sm text-anthracite/60">Aucun match importé pour l&apos;instant.</p>
          )}
        </ul>
      </div>
    </main>
  );
}
