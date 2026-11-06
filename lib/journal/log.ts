import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export async function logAction(
  actorId: string | null,
  action: string,
  details?: string
): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from("club_journal").insert({ actor_id: actorId, action, details: details ?? null });
}

export type JournalEntry = {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
  actor: { prenom: string; nom: string } | null;
};

export async function getRecentJournalEntries(limit = 50): Promise<JournalEntry[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("club_journal")
    .select("id, action, details, created_at, members(prenom, nom)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    details: row.details,
    created_at: row.created_at,
    actor: row.members as unknown as JournalEntry["actor"],
  }));
}
