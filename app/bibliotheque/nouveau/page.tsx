import { requireAnyRole } from "@/lib/auth/guard";
import { getThemeFamilies } from "@/lib/themes/queries";
import { getClubSettings } from "@/lib/club/settings";
import { PageHeader } from "@/components/page-header";
import { ExerciseForm } from "../exercise-form";

export default async function NouvelExercicePage() {
  await requireAnyRole(["entraineur"]);
  const [themeFamilies, clubSettings] = await Promise.all([getThemeFamilies(), getClubSettings()]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Nouvel exercice" backHref="/bibliotheque" />
      <div className="mt-6">
        <ExerciseForm mode="create" themeFamilies={themeFamilies} clubCategories={clubSettings.categories} />
      </div>
    </main>
  );
}
