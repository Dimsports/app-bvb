import { requireRole } from "@/lib/auth/guard";
import { getObjectifs, getAllMembersForAssignment } from "@/lib/projet/queries";
import { PageHeader } from "@/components/page-header";
import { ObjectifsBoard } from "./objectifs-board";

export default async function ProjetPage() {
  await requireRole("entraineur");
  const [objectifs, members] = await Promise.all([getObjectifs(), getAllMembersForAssignment()]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Projet club" backHref="/accueil" />
      <p className="mt-1 text-sm text-anthracite/60">Objectifs, actions, responsables et échéances.</p>

      <div className="mt-6">
        <ObjectifsBoard initialObjectifs={objectifs} members={members} />
      </div>
    </main>
  );
}
