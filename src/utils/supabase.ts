import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

let _supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  _supabase = createClient(supabaseUrl, supabaseKey);
} else {
  // Build-time or prerender context: Supabase is not configured.
  // The app renders the landing page; auth features will be unavailable
  // and will fail gracefully when the user tries to sign in.
  console.info("Supabase not configured. Auth features will be unavailable.");
}

/**
 * Get the Supabase client instance.
 * Returns null when Supabase environment variables are not set
 * (e.g. during prerender or local development without .env).
 */
export function getSupabaseClient(): SupabaseClient | null {
  return _supabase;
}

/**
 * Convenience export for direct import by legacy callers.
 * Prefer `getSupabaseClient()` in new code for null-safe access.
 * Uses a type assertion to avoid TypeScript errors in service files
 * that expect a non-null client. In prerender context these services
 * are never called because the landing page renders before auth.
 */
export const supabase = _supabase as NonNullable<typeof _supabase>;
