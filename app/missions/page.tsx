import { requireRole } from "@/lib/auth/guard";
import { getMissionsFeed, getMissionsHistoryForMember } from "@/lib/matches/queries";
import { getBenevoleProfile } from "@/lib/benevoles/queries";
import { PageHeader } from "@/components/page-header";
import { MissionsFeed } from "./missions-feed";
import { ProfileSection } from "./profile-section";
import { HistorySection } from "./history-section";

export default async function MissionsPage() {
  const session = await requireRole("benevole");
  const [feed, profile, history] = await Promise.all([
    getMissionsFeed(session.memberId),
    getBenevoleProfile(session.memberId),
    getMissionsHistoryForMember(session.memberId),
  ]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Missions bénévoles" backHref="/accueil" />
      <p className="mt-1 text-sm text-anthracite/60">Besoins du club à venir, toutes équipes.</p>

      <div className="mt-6 flex flex-col gap-4">
        <MissionsFeed feed={feed} />
        <ProfileSection initialProfile={profile} />
        <HistorySection history={history} />
      </div>
    </main>
  );
}
