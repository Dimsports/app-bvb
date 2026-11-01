import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type BenevoleProfile = {
  contact_telephone: string | null;
  contact_email: string | null;
  disponibilites: string | null;
};

export async function getBenevoleProfile(memberId: string): Promise<BenevoleProfile> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("benevole_profiles")
    .select("contact_telephone, contact_email, disponibilites")
    .eq("member_id", memberId)
    .maybeSingle();

  return {
    contact_telephone: data?.contact_telephone ?? null,
    contact_email: data?.contact_email ?? null,
    disponibilites: data?.disponibilites ?? null,
  };
}

export type BenevoleDirectoryEntry = {
  id: string;
  prenom: string;
  nom: string;
  profile: BenevoleProfile;
  missionsCount: number;
};

export async function getBenevolesDirectory(): Promise<BenevoleDirectoryEntry[]> {
  const supabase = getServiceClient();

  const { data: members } = await supabase
    .from("members")
    .select("id, prenom, nom, roles")
    .contains("roles", ["benevole"])
    .order("nom", { ascending: true });

  const benevoles = members ?? [];
  if (benevoles.length === 0) return [];

  const memberIds = benevoles.map((m) => m.id);

  const [{ data: profileRows }, { data: inscriptionRows }] = await Promise.all([
    supabase
      .from("benevole_profiles")
      .select("member_id, contact_telephone, contact_email, disponibilites")
      .in("member_id", memberIds),
    supabase.from("match_mission_inscriptions").select("member_id").in("member_id", memberIds),
  ]);

  const profileByMember = new Map((profileRows ?? []).map((p) => [p.member_id, p]));
  const countByMember = new Map<string, number>();
  for (const row of inscriptionRows ?? []) {
    countByMember.set(row.member_id, (countByMember.get(row.member_id) ?? 0) + 1);
  }

  return benevoles.map((m) => {
    const profile = profileByMember.get(m.id);
    return {
      id: m.id,
      prenom: m.prenom,
      nom: m.nom,
      profile: {
        contact_telephone: profile?.contact_telephone ?? null,
        contact_email: profile?.contact_email ?? null,
        disponibilites: profile?.disponibilites ?? null,
      },
      missionsCount: countByMember.get(m.id) ?? 0,
    };
  });
}
