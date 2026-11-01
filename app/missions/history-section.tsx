import { teamLabel } from "@/lib/teams/constants";
import type { MissionHistoryEntry } from "@/lib/matches/queries";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function HistorySection({ history }: { history: MissionHistoryEntry[] }) {
  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="font-medium text-anthracite">Historique</h2>
      {history.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {history.map((h, i) => (
            <li key={i} className="text-sm text-anthracite">
              <span className="text-anthracite/50">{DATE_FORMAT.format(new Date(`${h.match.date}T00:00:00`))}</span>
              {" · "}
              {h.missionTitre}
              {" · "}
              {h.match.team ? teamLabel(h.match.team) : ""} {h.match.domicile ? "vs" : "@"} {h.match.adversaire}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-anthracite/50">Aucune mission effectuée pour l&apos;instant.</p>
      )}
    </section>
  );
}
