import { requireRole } from "@/lib/auth/guard";
import { getClubFeatures } from "@/lib/features/queries";
import { PageHeader } from "@/components/page-header";
import { FeaturesBoard } from "./features-board";

export default async function FonctionnalitesPage() {
  await requireRole("admin");
  const features = await getClubFeatures();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Fonctionnalités" backHref="/administration" />
      <p className="mt-1 text-sm text-anthracite/60">
        Active ou désactive un module pour tout le club, et choisis quels rôles y ont accès.
      </p>

      <div className="mt-6">
        <FeaturesBoard initialFeatures={features} />
      </div>
    </main>
  );
}
