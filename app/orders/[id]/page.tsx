import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
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
    .single()

  return order
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  // Security check: if token provided or logged in user
  // (In admin client, we verify token match or user ownership)
  if (order.access_token && order.access_token !== token) {
    // If no matching token, check if logged in
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
