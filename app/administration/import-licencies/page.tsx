import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { getAllTeams } from "@/lib/teams/queries";
import { PageHeader } from "@/components/page-header";
import { ImportForm } from "./import-form";

export default async function ImportLicenciesPage() {
  await requireRole("admin");

  const supabase = getServiceClient();
  const [{ data: existingMembers }, teams] = await Promise.all([
    supabase.from("members").select("prenom, nom"),
    getAllTeams(),
  ]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Import des licenciés" backHref="/administration" />
      <p className="mt-1 text-sm text-anthracite/60">
        Créez plusieurs membres d&apos;un coup à partir d&apos;un fichier CSV ou Excel.
      </p>

      <div className="mt-6">
        <ImportForm teams={teams} existingMembers={existingMembers ?? []} />
      </div>
    </main>
  );
}
