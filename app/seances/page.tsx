import Link from "next/link";
import { requireAnyRole, requireFeature } from "@/lib/auth/guard";
import { getSeancesForMember } from "@/lib/seances/queries";
import { getRelevantVacance } from "@/lib/season/vacances";
import { isModuleAllowedForRoles } from "@/lib/features/queries";
import { teamLabel } from "@/lib/teams/constants";

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const VACANCE_DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function SeancesPage() {
  await requireFeature("seances");
  const session = await requireAnyRole(["entraineur", "coach"]);
  const isAdmin = session.roles.includes("admin");
  const seances = await getSeancesForMember(session.memberId, isAdmin);
  const canCreate = isAdmin || session.roles.includes("entraineur");
  const showVacance = await isModuleAllowedForRoles("saison", session.roles);
  const vacance = showVacance ? getRelevantVacance(todayISO()) : null;

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-title text-2xl text-anthracite">Séances</h1>
        {canCreate && (
          <Link
            href="/seances/nouveau"
            className="h-11 shrink-0 rounded-lg bg-anthracite px-4 text-sm font-medium leading-[44px] text-white"
          >
            + Nouvelle séance
          </Link>
        )}
      </div>

      {vacance && (
        <p className="mt-3 text-sm text-anthracite/50">
          {vacance.nom}
          {" · "}
          {VACANCE_DATE_FORMAT.format(new Date(`${vacance.dateDebut}T00:00:00`))}
          {vacance.dateFin ? ` – ${VACANCE_DATE_FORMAT.format(new Date(`${vacance.dateFin}T00:00:00`))}` : ""}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {seances.map((s) => (
          <li key={s.id}>
            <Link
              href={`/seances/${s.id}`}
              className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition active:bg-turquoise/10"
            >
              <div>
                <p className="font-medium capitalize text-anthracite">
                  {WEEKDAY_FORMAT.format(new Date(`${s.date}T00:00:00`))}
                </p>
                <p className="text-sm text-anthracite/60">
                  {s.team ? teamLabel(s.team) : ""}
                  {s.titre ? ` · ${s.titre}` : ""}
                  {s.blocCount > 0 ? ` · ${s.blocCount} bloc${s.blocCount > 1 ? "s" : ""} · ${s.totalMinutes} min` : ""}
                </p>
              </div>
              <span className="text-anthracite/40">→</span>
            </Link>
          </li>
        ))}
        {seances.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucune séance pour l&apos;instant.</p>
        )}
      </ul>
    </main>
  );
}
