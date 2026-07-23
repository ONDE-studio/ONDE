import { redirect } from "next/navigation"
import { createClient as createServerClient } from "@/lib/supabase/server"

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

  // 3. Check profiles table via user's authenticated server client (RLS permits reading own profile: auth.uid() = id)
  if (!isAdmin) {
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    isAdmin = profile?.role === "admin"
  }

  // 4. Fallback: match OWNER_EMAIL if set
  if (!isAdmin && process.env.OWNER_EMAIL) {
    const ownerEmail = process.env.OWNER_EMAIL.trim().toLowerCase()
    if (user.email?.trim().toLowerCase() === ownerEmail) {
      isAdmin = true
    }
  }

  // 5. Not admin -> redirect to account
  if (!isAdmin) {
    redirect("/account")
  }

  return <>{children}</>
}
