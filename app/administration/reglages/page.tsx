import { requireRole } from "@/lib/auth/guard";
import { getClubSettings } from "@/lib/club/settings";
import { PageHeader } from "@/components/page-header";
import { ReglagesForm } from "./reglages-form";

export default async function ReglagesPage() {
  await requireRole("admin");
  const settings = await getClubSettings();

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Réglages du club" backHref="/administration" />

      <div className="mt-6">
        <ReglagesForm initial={settings} />
      </div>
    </main>
  );
}
