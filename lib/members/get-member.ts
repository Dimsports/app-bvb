import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  prenom: string;
  nom: string;
  roles: string[];
};

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, prenom, nom, roles")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
