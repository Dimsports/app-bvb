import { requireRole } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";
import { MembersAdmin, type MemberRow } from "./members-admin";

export default async function AdminMembresPage() {
  await requireRole("admin");

  const supabase = getServiceClient();
  const { data } = await supabase
    .from("members")
    .select("id, prenom, nom, roles, code_length, locked_until")
    .order("nom", { ascending: true });

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <h1 className="font-title text-2xl text-anthracite">Membres du club</h1>
      <p className="mt-1 text-sm text-anthracite/60">
        Créez les membres et gérez leurs codes de connexion.
      </p>

      <MembersAdmin initialMembers={(data ?? []) as MemberRow[]} />
    </main>
  );
}
