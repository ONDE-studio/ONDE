import "server-only"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { User } from "@supabase/supabase-js"

export interface AuthenticatedAdmin {
  user: User
  role: "admin"
}

/**
 * Server-only helper to enforce admin authorization.
 * Verifies that the current request has an authenticated session and
 * that the user has an admin role in app_metadata or in the profiles table.
 *
 * Throws an Error if unauthorized, or returns the authenticated admin user.
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const serverSupabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await serverSupabase.auth.getUser()

  if (error || !user) {
    throw new Error("UNAUTHORIZED:Требуется авторизация")
  }

  // 1. Check app_metadata.role (server-controlled)
  let isAdmin = user.app_metadata?.role === "admin"

  // 2. Check profiles table if app_metadata is not set
  if (!isAdmin) {
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    isAdmin = profile?.role === "admin"
  }

  if (!isAdmin) {
    throw new Error("FORBIDDEN:Недостаточно прав администратора")
  }

  return { user, role: "admin" }
}
