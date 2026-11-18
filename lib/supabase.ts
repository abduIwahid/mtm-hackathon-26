import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Returns null when env is not set, so the demo never crashes on a
// missing database. Wire real tables on the day if the problem needs them.
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}
