import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export type WellbeingEntry = {
  id: string;
  date: string;
  sommeil: number;
  forme: number;
  courbatures: number;
  moral: number;
  commentaire: string | null;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayEntry(memberId: string): Promise<WellbeingEntry | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("wellbeing_entries")
    .select("id, date, sommeil, forme, courbatures, moral, commentaire")
    .eq("member_id", memberId)
    .eq("date", today())
    .maybeSingle();
  return data ?? null;
}

export async function getRecentEntries(memberId: string, limit = 7): Promise<WellbeingEntry[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("wellbeing_entries")
    .select("id, date, sommeil, forme, courbatures, moral, commentaire")
    .eq("member_id", memberId)
    .order("date", { ascending: false })
    .limit(limit);
  return data ?? [];
}
