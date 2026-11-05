import { requireRole } from "@/lib/auth/guard";
import { getBenevolesDirectory } from "@/lib/benevoles/queries";
import { PageHeader } from "@/components/page-header";

export default async function AdminBenevolesPage() {
  await requireRole("admin");
  const benevoles = await getBenevolesDirectory();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Bénévoles" backHref="/accueil" />
      <p className="mt-1 text-sm text-anthracite/60">
        Annuaire, contact et missions effectuées, toutes équipes.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {benevoles.map((b) => (
          <li key={b.id} className="rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium text-anthracite">
                {b.prenom} {b.nom}
              </p>
              <span className="shrink-0 text-sm text-anthracite/50">
                {b.missionsCount} mission{b.missionsCount > 1 ? "s" : ""}
              </span>
            </div>
            {(b.profile.contact_telephone || b.profile.contact_email) && (
              <p className="mt-1 text-sm text-anthracite/60">
                {[b.profile.contact_telephone, b.profile.contact_email].filter(Boolean).join(" · ")}
              </p>
            )}
            {b.profile.disponibilites && (
              <p className="mt-1 text-sm text-anthracite/70">{b.profile.disponibilites}</p>
            )}
            {!b.profile.contact_telephone && !b.profile.contact_email && !b.profile.disponibilites && (
              <p className="mt-1 text-sm text-anthracite/40">Profil non complété.</p>
            )}
          </li>
        ))}
        {benevoles.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucun bénévole pour l&apos;instant.</p>
        )}
      </ul>
    </main>
  );
}
