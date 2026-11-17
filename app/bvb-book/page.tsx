import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guard";
import { getBvbBook } from "@/lib/competences/queries";
import { getClubSettings } from "@/lib/club/settings";
import { PageHeader } from "@/components/page-header";
import { CategorieFilter } from "./categorie-filter";

export default async function BvbBookPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const session = await requireAnyRole(["admin", "entraineur", "coach"]);
  const { categorie } = await searchParams;
  const [domains, clubSettings] = await Promise.all([
    getBvbBook({ categorie }),
    getClubSettings(),
  ]);

  const canEdit = session.roles.includes("admin") || session.roles.includes("entraineur");
  const totalCompetences = domains.reduce((sum, d) => sum + d.competences.length, 0);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="BVB Book"
          backHref="/accueil"
          subtitle={`${totalCompetences} compétence${totalCompetences > 1 ? "s" : ""}`}
        />
        {canEdit && (
          <Link
            href="/bvb-book/nouveau"
            className="h-11 shrink-0 rounded-lg bg-anthracite px-4 text-sm font-medium leading-[44px] text-white"
          >
            + Nouvelle compétence
          </Link>
        )}
      </div>

      <p className="mt-1 text-sm text-anthracite/60">
        Référentiel de formation du club : les compétences attendues par catégorie, regroupées par
        domaine.
      </p>

      <div className="mt-6">
        <CategorieFilter categories={clubSettings.categories} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {domains.map((domain) => (
          <section key={domain.domainId}>
            <h2 className="font-title text-xl text-anthracite">{domain.domainNom}</h2>
            {domain.competences.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {domain.competences.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/bvb-book/${c.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 shadow-sm transition active:bg-turquoise/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-anthracite">{c.nom}</p>
                        {c.categories.length > 0 && (
                          <p className="text-sm text-anthracite/60">{c.categories.join(" · ")}</p>
                        )}
                      </div>
                      <span className="text-anthracite/40">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-anthracite/50">Aucune compétence pour l&apos;instant.</p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
