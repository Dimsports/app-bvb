import { requireAnyRole } from "@/lib/auth/guard";
import { ExerciseForm } from "../exercise-form";

export default async function NouvelExercicePage() {
  await requireAnyRole(["entraineur"]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Nouvel exercice</h1>
      <div className="mt-6">
        <ExerciseForm mode="create" />
      </div>
    </main>
  );
}
