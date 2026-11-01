"use server";

import { requireSession } from "@/lib/auth/guard";
import { getServiceClient } from "@/lib/supabase/server";

export async function subscribeToPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ ok: boolean }> {
  const session = await requireSession();

  const supabase = getServiceClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      member_id: session.memberId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { ok: false };
  return { ok: true };
}

export async function unsubscribeFromPush(endpoint: string): Promise<{ ok: boolean }> {
  const session = await requireSession();

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("member_id", session.memberId);
  if (error) return { ok: false };
  return { ok: true };
}
