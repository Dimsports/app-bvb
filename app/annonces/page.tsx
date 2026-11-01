import { requireSession } from "@/lib/auth/guard";
import { getAnnonces } from "@/lib/annonces/queries";
import { AnnonceFeed } from "./annonce-feed";

export default async function AnnoncesPage() {
  const session = await requireSession();
  const canPost = session.roles.includes("admin") || session.roles.includes("entraineur");
  const annonces = await getAnnonces();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Annonces</h1>
      <p className="mt-1 text-sm text-anthracite/60">Informations du club.</p>

      <div className="mt-6">
        <AnnonceFeed canPost={canPost} initialAnnonces={annonces} />
      </div>
    </main>
  );
}
