import { requireRole } from "@/lib/auth/guard";
import { getObjectifs, getAllMembersForAssignment } from "@/lib/projet/queries";
import { ObjectifsBoard } from "./objectifs-board";

export default async function ProjetPage() {
  await requireRole("entraineur");
  const [objectifs, members] = await Promise.all([getObjectifs(), getAllMembersForAssignment()]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Projet club</h1>
      <p className="mt-1 text-sm text-anthracite/60">Objectifs, actions, responsables et échéances.</p>

      <div className="mt-6">
        <ObjectifsBoard initialObjectifs={objectifs} members={members} />
      </div>
    </main>
  );
}
