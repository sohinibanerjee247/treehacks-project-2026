import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client that bypasses RLS.
 * Used by the matching engine to update other users' profiles and orders.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
