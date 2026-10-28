import { requireRole } from "@/lib/auth/guard";
import { getTodayEntry } from "@/lib/wellbeing/queries";
import { WellbeingForm } from "./wellbeing-form";

export default async function BienEtrePage() {
  const session = await requireRole("joueur");
  const todayEntry = await getTodayEntry(session.memberId);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Bien-être</h1>
      <p className="mt-1 text-sm text-anthracite/60">
        Visible uniquement par tes entraineurs. Ça les aide à adapter les séances.
      </p>

      <div className="mt-6">
        <WellbeingForm todayEntry={todayEntry} />
      </div>
    </main>
  );
}
