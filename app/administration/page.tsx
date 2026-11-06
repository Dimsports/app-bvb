import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/page-header";

const SECTIONS = [
  { href: "/admin/membres", label: "Membres", description: "Créer, modifier, rôles et codes." },
  { href: "/administration/import-licencies", label: "Import des licenciés", description: "Import CSV/Excel, création en lot." },
  { href: "/admin/equipes", label: "Équipes", description: "Catégories, staff, créneaux." },
  { href: "/admin/matchs", label: "Matchs", description: "Import du calendrier FFBB." },
  { href: "/admin/benevoles", label: "Bénévoles", description: "Annuaire et missions." },
  { href: "/administration/fonctionnalites", label: "Fonctionnalités", description: "Activer/désactiver les modules du club." },
  { href: "/administration/thematiques", label: "Thématiques", description: "Référentiel basket de la bibliothèque d'exercices." },
  { href: "/administration/reglages", label: "Réglages du club", description: "Nom, saison, gymnases, catégories." },
  { href: "/administration/journal", label: "Journal", description: "Dernières actions sensibles." },
];

export default async function AdministrationPage() {
  await requireRole("admin");

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Administration" backHref="/accueil" />
      <p className="mt-1 text-sm text-anthracite/60">Gestion complète du club.</p>

      <ul className="mt-6 flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition active:bg-turquoise/10"
            >
              <div>
                <p className="font-medium text-anthracite">{s.label}</p>
                <p className="text-sm text-anthracite/60">{s.description}</p>
              </div>
              <span className="text-anthracite/40">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
