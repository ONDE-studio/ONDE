import { redirect } from "next/navigation"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const serverSupabase = await createServerClient()
  const {
    data: { session },
  } = await serverSupabase.auth.getSession()

  // 1. Unauthenticated -> redirect to login
  if (!session?.user) {
    redirect("/login?admin=1")
  }

  // 2. Check admin role via app_metadata
  let isAdmin = session.user.app_metadata?.role === "admin"

  // 3. Double-check profiles table via admin client
  if (!isAdmin) {
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()

    isAdmin = profile?.role === "admin"
  }

  // 4. Not admin -> check if setup is needed or redirect to account
  if (!isAdmin) {
    const adminSupabase = createAdminClient()
    const { data: existingAdmins } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)

    // If no admin exists in the system at all, redirect to setup
    if (!existingAdmins || existingAdmins.length === 0) {
      redirect("/admin/setup")
    }

    // Otherwise forbid regular customers from opening admin
    redirect("/account")
  }

  return <>{children}</>
}
