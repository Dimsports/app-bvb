import Link from "next/link";
import { requireAnyRole, requireFeature } from "@/lib/auth/guard";
import { getMatchesForMember } from "@/lib/matches/queries";
import { teamLabel } from "@/lib/teams/constants";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export default async function MatchsPage() {
  await requireFeature("matchs");
  const session = await requireAnyRole(["entraineur", "coach"]);
  const isAdmin = session.roles.includes("admin");
  const matches = await getMatchesForMember(session.memberId, isAdmin);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Matchs</h1>

      <ul className="mt-6 flex flex-col gap-3">
        {matches.map((m) => (
          <li key={m.id}>
            <Link
              href={`/matchs/${m.id}`}
              className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition active:bg-turquoise/10"
            >
              <div>
                <p className="font-medium text-anthracite">
                  {DATE_FORMAT.format(new Date(`${m.date}T00:00:00`))}
                  {m.heure ? ` · ${m.heure.slice(0, 5)}` : ""} — {m.domicile ? "vs" : "@"}{" "}
                  {m.adversaire}
                </p>
                <p className="text-sm text-anthracite/60">{m.team ? teamLabel(m.team) : ""}</p>
              </div>
              <span className="text-anthracite/40">→</span>
            </Link>
          </li>
        ))}
        {matches.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucun match pour l&apos;instant.</p>
        )}
      </ul>
    </main>
  );
}
