"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StoreShell } from "@/components/store-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"

export default function AccountPage() {
  const { ready, currentUser, orders, logout } = useStore()
  const { t, formatPrice, formatDate } = useI18n()
  const router = useRouter()

  useEffect(() => {
    if (ready && !currentUser) router.replace("/login")
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

  const myOrders = orders.filter((o) => o.userEmail === currentUser.email)

  return (
    <StoreShell>
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            <h1 className="mt-1 font-serif text-4xl font-medium tracking-tight md:text-5xl">
              {t("account.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {currentUser.name}
            </p>
          </div>
          <div className="flex gap-3">
            {currentUser.role === "admin" && (
              <Button asChild variant="outline">
                <Link href="/admin">{t("nav.admin")}</Link>
              </Button>
            )}
            <Button variant="ghost" onClick={logout}>
              {t("nav.logout")}
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-serif text-2xl font-medium tracking-tight">{t("account.orders")}</h2>

          {myOrders.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">{t("account.noOrders")}</p>
              <Button asChild className="mt-4">
                <Link href="/#catalog">{t("account.goCatalog")}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </span>
                      <span className="font-medium">{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <span className="text-sm">
                          {item.name}
                          <span className="text-muted-foreground"> × {item.quantity}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </StoreShell>
  )
}
