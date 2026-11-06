import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { getAllTeams } from "@/lib/teams/queries";
import { PageHeader } from "@/components/page-header";
import { MembersAdmin, type MemberRow } from "./members-admin";

export default async function AdminMembresPage() {
  await requireRole("admin");

  const supabase = getServiceClient();
  const [{ data }, teams] = await Promise.all([
    supabase
      .from("members")
      .select("id, prenom, nom, roles, code_length, locked_until")
      .order("nom", { ascending: true }),
    getAllTeams(),
  ]);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader title="Membres du club" backHref="/administration" />
      <p className="mt-1 text-sm text-anthracite/60">
        Créez les membres et gérez leurs codes de connexion.
      </p>

      <MembersAdmin initialMembers={(data ?? []) as MemberRow[]} teams={teams} />
    </main>
  );
}
