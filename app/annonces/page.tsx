import { requireSession } from "@/lib/auth/guard";
import { getAnnonces } from "@/lib/annonces/queries";
import { PageHeader } from "@/components/page-header";
import { AnnonceFeed } from "./annonce-feed";
import { PushToggle } from "./push-toggle";

export default async function AnnoncesPage() {
  const session = await requireSession();
  const canPost = session.roles.includes("admin") || session.roles.includes("entraineur");
  const annonces = await getAnnonces();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Annonces" backHref="/accueil" />
      <p className="mt-1 text-sm text-anthracite/60">Informations du club.</p>

      <div className="mt-6 flex flex-col gap-4">
        <PushToggle />
        <AnnonceFeed canPost={canPost} initialAnnonces={annonces} />
      </div>
    </main>
  );
}
