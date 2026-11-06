import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guard";
import { getExercises } from "@/lib/exercises/queries";
import { getThemeFamilies } from "@/lib/themes/queries";
import { getClubSettings } from "@/lib/club/settings";
import { PARTIE_LABELS, PARTIE_COLOR_VAR, isPartie, isRecentExercise } from "@/lib/exercises/constants";
import { PageHeader } from "@/components/page-header";
import { Filters } from "./filters";

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{
    partie?: string;
    q?: string;
    theme?: string;
    categorie?: string;
    espace?: string;
    intensite?: string;
    opposition?: string;
    joueurs?: string;
  }>;
}) {
  const session = await requireAnyRole(["entraineur", "coach"]);
  const { partie, q, theme, categorie, espace, intensite, opposition, joueurs } = await searchParams;
  const [exercises, themeFamilies, clubSettings] = await Promise.all([
    getExercises({
      partie,
      query: q,
      themeId: theme,
      categorie,
      espace,
      intensite,
      opposition,
      nbJoueurs: joueurs ? Number(joueurs) : undefined,
    }),
    getThemeFamilies(),
    getClubSettings(),
  ]);
  const canCreate =
    session.roles.includes("admin") ||
    session.roles.includes("entraineur") ||
    session.roles.includes("coach");

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Bibliothèque d'exercices"
          backHref="/accueil"
          subtitle={`${exercises.length} exercice${exercises.length > 1 ? "s" : ""}`}
        />
        {canCreate && (
          <Link
            href="/bibliotheque/nouveau"
            className="h-11 shrink-0 rounded-lg bg-anthracite px-4 text-sm font-medium leading-[44px] text-white"
          >
            + Nouvel exercice
          </Link>
        )}
      </div>

      <div className="mt-6">
        <Filters themeFamilies={themeFamilies} clubCategories={clubSettings.categories} />
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {exercises.map((ex) => (
          <li key={ex.id}>
            <Link
              href={`/bibliotheque/${ex.id}`}
              className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm transition active:bg-turquoise/10"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: isPartie(ex.partie) ? PARTIE_COLOR_VAR[ex.partie] : "transparent",
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-medium text-anthracite">
                  <span className="truncate">{ex.titre}</span>
                  {isRecentExercise(ex.created_at) && (
                    <span className="shrink-0 rounded-full bg-turquoise/15 px-2 py-0.5 text-xs font-medium text-turquoise-contrast">
                      Nouveau
                    </span>
                  )}
                </p>
                <p className="text-sm text-anthracite/60">
                  {isPartie(ex.partie) ? PARTIE_LABELS[ex.partie] : ex.partie}
                  {ex.duree_defaut_minutes ? ` · ${ex.duree_defaut_minutes} min` : ""}
                  {ex.media_type ? " · média" : ""}
                </p>
              </div>
              <span className="text-anthracite/40">→</span>
            </Link>
          </li>
        ))}
        {exercises.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucun exercice pour l&apos;instant.</p>
        )}
      </ul>
    </main>
  );
}
