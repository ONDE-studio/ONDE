"use client"

import { useMemo } from "react"
import { Send } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import type { OrderStatus } from "@/lib/types"

const STATUSES: OrderStatus[] = ["new", "in_progress", "done", "cancelled"]

export function AdminOrders() {
  const { orders, updateOrderStatus } = useStore()
  const { t, formatPrice, formatDate } = useI18n()

  const sorted = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders],
  )

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((o) => (
        <div key={o.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-medium">{o.id}</span>
              <StatusBadge status={o.status} />
              {o.method === "telegram" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  <Send className="h-3 w-3" />
                  Telegram
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1">
                {o.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.name}
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </span>
                    <span className="text-muted-foreground">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {o.comment && (
                <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  {o.comment}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div>
                <p className="text-sm font-medium">{o.customerName}</p>
                <p className="text-sm text-muted-foreground">{o.contact}</p>
              </div>
              <p className="font-serif text-xl font-medium">{formatPrice(o.total)}</p>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t("admin.status")}</label>
                <select
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground/50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
