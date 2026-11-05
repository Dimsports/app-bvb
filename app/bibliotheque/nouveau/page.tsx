import { requireAnyRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/page-header";
import { ExerciseForm } from "../exercise-form";

export default async function NouvelExercicePage() {
  await requireAnyRole(["entraineur"]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Nouvel exercice" backHref="/bibliotheque" />
      <div className="mt-6">
        <ExerciseForm mode="create" />
      </div>
    </main>
  );
}
