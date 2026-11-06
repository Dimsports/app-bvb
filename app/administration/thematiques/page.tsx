import { requireRole } from "@/lib/auth/guard";
import { getThemeFamilies } from "@/lib/themes/queries";
import { PageHeader } from "@/components/page-header";
import { ThemesBoard } from "./themes-board";

export default async function ThematiquesPage() {
  await requireRole("admin");
  const families = await getThemeFamilies();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Thématiques de la bibliothèque" backHref="/administration" />
      <p className="mt-1 text-sm text-anthracite/60">
        Référentiel basket utilisé pour classer les exercices. Renommez, ajoutez ou supprimez une
        thématique dans chaque famille.
      </p>

      <div className="mt-6">
        <ThemesBoard families={families} />
      </div>
    </main>
  );
}
