"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import type { Product } from "@/lib/types"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useCartUI } from "./cart-ui"

export function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: (p: Product) => void
}) {
  const { t, formatPrice } = useI18n()
  const { addToCart } = useStore()
  const { setOpen } = useCartUI()

  return (
    <article className="group flex flex-col">
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-card"
        aria-label={product.name}
      >
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
        {/* Sale badge — shown instead of Featured if both */}
        {product.isOnSale && product.discountPercent ? (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            -{product.discountPercent}%
          </span>
        ) : product.featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground backdrop-blur">
            {t("catalog.featured")}
          </span>
        ) : null}
        <span className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/5" />
      </button>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.category}
          </p>
          <h3
            className="mt-1 cursor-pointer truncate font-serif text-lg text-foreground"
            onClick={() => onOpen(product)}
          >
            {product.name}
          </h3>
          {product.isOnSale && product.originalPrice ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-medium text-destructive">{formatPrice(product.price)}</span>
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">{formatPrice(product.price)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            addToCart(product)
            setOpen(true)
          }}
          aria-label={t("product.add")}
          className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-primary hover:text-primary-foreground active:translate-y-px"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </article>
  )
}
