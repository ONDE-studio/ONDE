import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { OrderSuccessClient } from "./order-success-client"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export const metadata: Metadata = {
  title: "Детали заявки на заказ | ONDE Studio",
  robots: { index: false, follow: false },
}

async function getOrder(id: string) {
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .or(`id.eq.${id},public_number.eq.${id}`)
    .maybeSingle()

  return order
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  // Security Verification:
  // 1. Guest access via access token
  const hasValidToken = Boolean(token && order.access_token && token === order.access_token)

  // 2. Authenticated user ownership / admin check
  const serverSupabase = await createServerClient()
  const { data: { session } } = await serverSupabase.auth.getSession()
  const currentUserId = session?.user?.id

  const isOwner = Boolean(currentUserId && order.user_id && currentUserId === order.user_id)
  const isAdmin = Boolean(
    session?.user?.app_metadata?.role === "admin" || session?.user?.user_metadata?.role === "admin"
  )

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

        <OrderSuccessClient order={order} />
      </div>
    </div>
  )
}
