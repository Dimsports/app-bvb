import { notFound } from "next/navigation";
import { requireTeamStaff } from "@/lib/auth/guard";
import { getSeanceDetail } from "@/lib/seances/queries";
import Link from "next/link";
import { teamLabel } from "@/lib/teams/constants";
import { SeanceInfoForm } from "./seance-info-form";
import { BlocEditor } from "./bloc-editor";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function SeanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seance = await getSeanceDetail(id);
  if (!seance) notFound();

  const session = await requireTeamStaff(seance.team_id);
  const canEdit = session.roles.includes("admin") || session.roles.includes("entraineur");

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <p className="text-sm text-anthracite/60">{seance.team ? teamLabel(seance.team) : ""}</p>
      <h1 className={`font-title text-2xl text-anthracite ${seance.titre ? "" : "capitalize"}`}>
        {seance.titre || DATE_FORMAT.format(new Date(`${seance.date}T00:00:00`))}
      </h1>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/seances/${seance.id}/terrain`}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-anthracite font-medium text-white"
        >
          ▶ Lancer en mode terrain
        </Link>
        <Link
          href={`/seances/${seance.id}/appel`}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-anthracite/20 font-medium text-anthracite"
        >
          Faire l&apos;appel
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {canEdit ? (
          <SeanceInfoForm
            seanceId={seance.id}
            initial={{
              date: seance.date,
              heureDebut: seance.heure_debut ?? "",
              heureFin: seance.heure_fin ?? "",
              titre: seance.titre ?? "",
            }}
          />
        ) : (
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <p className="capitalize text-anthracite">
              {DATE_FORMAT.format(new Date(`${seance.date}T00:00:00`))}
            </p>
            {seance.heure_debut && (
              <p className="text-sm text-anthracite/60">
                {seance.heure_debut.slice(0, 5)}
                {seance.heure_fin ? `–${seance.heure_fin.slice(0, 5)}` : ""}
              </p>
            )}
          </section>
        )}

        <BlocEditor seanceId={seance.id} canEdit={canEdit} initialBlocs={seance.blocs} />
      </div>
    </main>
  );
}
