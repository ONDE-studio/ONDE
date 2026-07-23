"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StoreShell } from "@/components/store-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { ExternalLink } from "lucide-react"

export default function AccountPage() {
  const { ready, currentUser, logout } = useStore()
  const { t, formatPrice, formatDate } = useI18n()
  const router = useRouter()
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (ready && !currentUser) {
      router.replace("/login")
      return
    }

    if (currentUser) {
      const supabase = createClient()
      supabase
        .from("orders")
        .select("*")
        .or(`user_id.eq.${currentUser.id},contact.ilike.%${currentUser.email}%`)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setUserOrders(data)
          setLoadingOrders(false)
        })
    }
  }, [ready, currentUser, router])

  if (!ready || !currentUser) {
    return (
      <StoreShell>
        <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      </StoreShell>
    )
  }

  return (
    <StoreShell>
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{currentUser.email}</p>
            <h1 className="mt-1 font-serif text-4xl font-medium tracking-tight md:text-5xl">
              Личный кабинет
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {currentUser.name}
            </p>
          </div>
          <div className="flex gap-3">
            {currentUser.role === "admin" && (
              <Button asChild variant="outline">
                <Link href="/admin">Панель управления</Link>
              </Button>
            )}
            <Button variant="ghost" onClick={logout}>
              Выйти
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-serif text-2xl font-medium tracking-tight">Мои заявки на заказы</h2>

          {loadingOrders ? (
            <div className="mt-6 flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </div>
          ) : userOrders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">У вас пока нет оформленных заявок</p>
              <Button asChild className="mt-4">
                <Link href="/#catalog">Перейти в каталог</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {userOrders.map((order) => {
                const items = order.items_snapshot || order.items || []
                const publicNo = order.public_number || order.id

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/30 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          Заявка № {publicNo}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(order.created_at || order.createdAt)}</span>
                        <span className="font-semibold text-sm text-foreground">
                          {formatPrice(order.estimated_total || order.total || order.subtotal)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Состав заказа:</p>
                      <ul className="divide-y divide-border rounded-xl border border-border/60 bg-background/50 p-3 text-xs space-y-1">
                        {items.map((item: any, idx: number) => (
                          <li key={idx} className="flex justify-between py-1">
                            <span>
                              {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                            </span>
                            <span className="font-medium">{formatPrice(item.total || item.unitPrice * item.quantity || item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Доставка: <strong className="text-foreground">{order.delivery_provider_name || "Согласование"}</strong>
                      </span>
                      <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
                        <Link href={`/orders/${publicNo}?token=${order.access_token}`}>
                          Детали и Telegram
                          <ExternalLink className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </StoreShell>
  )
}
