import { requireRole } from "@/lib/auth/guard";
import { getThemeFamilies } from "@/lib/themes/queries";
import { getClubSettings } from "@/lib/club/settings";
import { PageHeader } from "@/components/page-header";
import { CompetenceForm } from "../competence-form";

export default async function NouvelleCompetencePage() {
  await requireRole("entraineur");
  const [domains, clubSettings] = await Promise.all([getThemeFamilies(), getClubSettings()]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Nouvelle compétence" backHref="/bvb-book" />
      <div className="mt-6">
        <CompetenceForm mode="create" domains={domains} clubCategories={clubSettings.categories} />
      </div>
    </main>
  );
}
