import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key.")
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
