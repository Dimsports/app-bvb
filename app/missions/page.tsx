import { requireRole } from "@/lib/auth/guard";
import { getMissionsFeed } from "@/lib/matches/queries";
import { MissionsFeed } from "./missions-feed";

export default async function MissionsPage() {
  const session = await requireRole("benevole");
  const feed = await getMissionsFeed(session.memberId);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Missions bénévoles</h1>
      <p className="mt-1 text-sm text-anthracite/60">Besoins du club à venir, toutes équipes.</p>

      <div className="mt-6">
        <MissionsFeed feed={feed} />
      </div>
    </main>
  );
}
