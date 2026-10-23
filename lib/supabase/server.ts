import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client service_role : bypasse RLS, ne doit jamais être exposé au client.
 * Toutes les lectures/écritures de l'app passent par ici, depuis des
 * Server Actions ou Route Handlers qui vérifient eux-mêmes la session.
 */
export function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis (voir .env.local)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
