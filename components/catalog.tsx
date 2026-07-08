"use client"

import { useMemo, useState } from "react"
import type { Product } from "@/lib/types"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { ProductCard } from "./product-card"
import { ProductQuickView } from "./product-quick-view"
import { Reveal } from "./reveal"
import { cn } from "@/lib/utils"

export function Catalog() {
  const { t } = useI18n()
  const { products } = useStore()
  const [active, setActive] = useState<string>("__all")
  const [selected, setSelected] = useState<Product | null>(null)

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.position - b.position),
    [products],
  )

  const categories = useMemo(() => {
    const set = new Set(sorted.map((p) => p.category).filter(Boolean))
    return ["__all", ...Array.from(set)]
  }, [sorted])

  const filtered = useMemo(
    () => (active === "__all" ? sorted : sorted.filter((p) => p.category === active)),
    [sorted, active],
  )

  return (
    <section id="catalog" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
      <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl text-foreground sm:text-4xl">{t("catalog.title")}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("catalog.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                active === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "__all" ? t("catalog.all") : c}
            </button>
          ))}
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">{t("catalog.empty")}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}>
              <ProductCard product={p} onOpen={setSelected} />
            </Reveal>
          ))}
        </div>
      )}

      <ProductQuickView product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
