"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp, Package, ShoppingBag, Wallet } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"

const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function AdminOverview() {
  const { orders, products, updateOrderStatus } = useStore()
  const { t, formatPrice, formatDate, locale } = useI18n()

  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === "done")
    const revenue = paidOrders.reduce((n, o) => n + o.total, 0)
    const avg = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0
    return {
      revenue,
      orders: orders.length,
      products: products.length,
      avg,
    }
  }, [orders, products])

  const monthly = useMemo(() => {
    const months = locale === "ru" ? MONTHS_RU : MONTHS_EN
    const map = new Map<string, number>()
    for (const o of orders) {
      if (o.status !== "done") continue
      const d = new Date(o.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      map.set(key, (map.get(key) ?? 0) + o.total)
    }
    // last 6 months window based on data
    const entries = Array.from(map.entries()).sort()
    return entries.map(([key, total]) => {
      const [, m] = key.split("-")
      return { label: months[Number(m)], total }
    })
  }, [orders, locale])

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>()
    for (const o of orders) {
      for (const item of o.items) {
        const cur = map.get(item.productId) ?? { name: item.name, qty: 0 }
        cur.qty += item.quantity
        map.set(item.productId, cur)
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [orders])

  const recent = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    [orders],
  )

  const cards = [
    { label: t("admin.revenue"), value: formatPrice(stats.revenue), icon: Wallet },
    { label: t("admin.ordersCount"), value: String(stats.orders), icon: ShoppingBag },
    { label: t("admin.productsCount"), value: String(stats.products), icon: Package },
    { label: t("admin.avgCheck"), value: formatPrice(stats.avg), icon: TrendingUp },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-serif text-2xl font-medium tracking-tight md:text-3xl">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* sales chart */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
          <h3 className="font-medium">{t("admin.salesByMonth")}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => [formatPrice(v), t("admin.revenue")]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  fill="url(#fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* top products */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="font-medium">{t("admin.topProducts")}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "var(--secondary)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="qty" fill="var(--foreground)" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* recent orders */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-medium">{t("admin.recentOrders")}</h3>
        <div className="mt-4 flex flex-col divide-y divide-border">
          {recent.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">{o.id}</span>
                <span className="text-sm text-muted-foreground">{o.customerName}</span>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none transition-colors focus:border-foreground/50"
                >
                  <option value="new">{t("status.new")}</option>
                  <option value="in_progress">{t("status.in_progress")}</option>
                  <option value="done">{t("status.done")}</option>
                  <option value="cancelled">{t("status.cancelled")}</option>
                </select>
                <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>
                <span className="w-24 text-right text-sm font-medium">{formatPrice(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
