"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, Boxes, ClipboardList, ArrowLeft, Store } from "lucide-react"
import { Logo } from "@/components/logo"
import { LanguageToggle } from "@/components/language-toggle"
import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminProducts } from "@/components/admin/admin-products"
import { AdminOrders } from "@/components/admin/admin-orders"
import { AdminShowcase } from "@/components/admin/admin-showcase"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type Tab = "overview" | "products" | "orders" | "showcase"

export default function AdminPage() {
  const { ready, currentUser, logout } = useStore()
  const { t } = useI18n()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")

  useEffect(() => {
    if (ready && (!currentUser || currentUser.role !== "admin")) {
      router.replace("/login?admin=1")
    }
  }, [ready, currentUser, router])

  if (!ready || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: t("admin.overview"), icon: BarChart3 },
    { id: "products", label: t("admin.products"), icon: Boxes },
    { id: "orders", label: t("admin.orders"), icon: ClipboardList },
    { id: "showcase", label: t("admin.showcase"), icon: Store },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Logo className="h-7" />
            <span className="hidden text-sm text-muted-foreground sm:block">
              {t("admin.title")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                {t("admin.backToStore")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
          {t("admin.title")}
        </h1>

        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setTab(tItem.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === tItem.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tItem.icon className="h-4 w-4" />
              {tItem.label}
              {tab === tItem.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 animate-fade-in">
          {tab === "overview" && <AdminOverview />}
          {tab === "products" && <AdminProducts />}
          {tab === "orders" && <AdminOrders />}
          {tab === "showcase" && <AdminShowcase />}
        </div>
      </div>
    </div>
  )
}
