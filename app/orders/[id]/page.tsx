import { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { verifyToken } from "@/lib/access-token"
import { OrderSuccessClient } from "./order-success-client"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export const metadata: Metadata = {
  title: "Детали заявки | ONDE Studio",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token: rawToken } = await searchParams

  const supabase = createAdminClient()

  // 1. Load order — use admin client so RLS doesn't block server lookup
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, public_number, status, customer_name, contact, recipient_address, " +
      "items_snapshot, subtotal, delivery_provider_name, delivery_service_name, " +
      "delivery_price, delivery_min_days, delivery_max_days, estimated_total, " +
      "currency, comment, created_at, user_id, consent_terms"
    )
    .or(`id.eq.${id},public_number.eq.${id}`)
    .maybeSingle()

  if (orderError || !order || typeof order !== 'object' || Array.isArray(order)) {
    notFound()
  }

  // Safe cast — notFound() above ensures order is a valid row object
  const safeOrder = order as Record<string, unknown>

  // 2. Verify guest token via stored hash (constant-time comparison)
  let hasValidToken = false
  if (rawToken) {
    const { data: tokenRecord } = await supabase
      .from("order_access_tokens")
      .select("id, token_hash, expires_at, revoked_at")
      .eq("order_id", safeOrder.id as string)
      .is("revoked_at", null)
      .maybeSingle()

    if (tokenRecord && !tokenRecord.revoked_at) {
      const notExpired = !tokenRecord.expires_at || new Date(tokenRecord.expires_at) > new Date()
      hasValidToken = notExpired && verifyToken(rawToken, tokenRecord.token_hash)

      if (hasValidToken) {
        // Update last_used_at (fire-and-forget)
        supabase
          .from("order_access_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", tokenRecord.id)
          .then(() => {})
      }
    }
  }

  // 3. Check authenticated session
  let isOwner = false
  let isAdmin = false

  const serverSupabase = await createServerClient()
  const { data: sessionData } = await serverSupabase.auth.getSession()
  const session = sessionData?.session

  if (session?.user) {
    isOwner = Boolean(safeOrder.user_id && session.user.id === safeOrder.user_id)
    // Admin check via app_metadata only (server-controlled, user cannot modify)
    isAdmin = session.user.app_metadata?.role === "admin"

    if (!isAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle()
      isAdmin = profile?.role === "admin"
    }
  }

  if (!hasValidToken && !isOwner && !isAdmin) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-8"
        >
          <ArrowLeft className="size-4" />
          Вернуться на главную
        </Link>
        <OrderSuccessClient order={safeOrder as any} />
      </div>
    </div>
  )
}
