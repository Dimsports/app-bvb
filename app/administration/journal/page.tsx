import { requireRole } from "@/lib/auth/guard";
import { getRecentJournalEntries } from "@/lib/journal/log";
import { PageHeader } from "@/components/page-header";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const ACTION_LABELS: Record<string, string> = {
  membre_cree: "Membre créé",
  membre_supprime: "Membre supprimé",
  code_reinitialise: "Code réinitialisé",
  fonctionnalite_modifiee: "Fonctionnalité modifiée",
  reglages_modifies: "Réglages modifiés",
  acces_membre_modifie: "Accès personnalisé modifié",
  thematique_ajoutee: "Thématique ajoutée",
  thematique_renommee: "Thématique renommée",
  thematique_supprimee: "Thématique supprimée",
  import_licencies: "Import de licenciés",
  installation: "Installation",
};

export default async function JournalPage() {
  await requireRole("admin");
  const entries = await getRecentJournalEntries();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Journal" backHref="/administration" />
      <p className="mt-1 text-sm text-anthracite/60">Dernières actions sensibles.</p>

      <ul className="mt-6 flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-anthracite">
                {ACTION_LABELS[entry.action] ?? entry.action}
              </p>
              <span className="shrink-0 text-xs text-anthracite/50">
                {DATE_FORMAT.format(new Date(entry.created_at))}
              </span>
            </div>
            <p className="mt-1 text-sm text-anthracite/60">
              {entry.actor ? `${entry.actor.prenom} ${entry.actor.nom}` : "Système"}
              {entry.details ? ` · ${entry.details}` : ""}
            </p>
          </li>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucune action pour l&apos;instant.</p>
        )}
      </ul>
    </main>
  );
}
