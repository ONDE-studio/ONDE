import { redirect } from "next/navigation"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const serverSupabase = await createServerClient()
  const {
    data: { user },
  } = await serverSupabase.auth.getUser()

  // 1. Unauthenticated -> redirect to login
  if (!user) {
    redirect("/login?admin=1")
  }

  // 2. Check admin role via app_metadata
  let isAdmin = user.app_metadata?.role === "admin"

  // 3. Fallback: check profiles table via admin client (bypasses RLS)
  if (!isAdmin) {
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    isAdmin = profile?.role === "admin"

    // Auto-sync app_metadata if profile has admin role
    if (isAdmin) {
      await adminSupabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          role: "admin",
        },
      })
    }
  }

  // 4. Fallback 2: Check by email if user matches OWNER_EMAIL
  if (!isAdmin && process.env.OWNER_EMAIL) {
    const ownerEmail = process.env.OWNER_EMAIL.trim().toLowerCase()
    if (user.email?.trim().toLowerCase() === ownerEmail) {
      const adminSupabase = createAdminClient()
      
      // Auto-grant admin role to OWNER_EMAIL in both profiles and app_metadata
      await adminSupabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", user.id)

      await adminSupabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          role: "admin",
        },
      })

      isAdmin = true
    }
  }

  // 5. Not admin -> check if setup is needed or redirect to account
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
