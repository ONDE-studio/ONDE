"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Minus, Plus, Send, ShoppingBag, X } from "lucide-react"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useCartUI } from "./cart-ui"
import { TELEGRAM_USERNAME } from "@/lib/mock-data"

export function ProductQuickView({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const { t, formatPrice } = useI18n()
  const { addToCart } = useStore()
  const { setOpen: setCartOpen } = useCartUI()
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (product) setQty(1)
  }, [product])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (product) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [product, onClose])

  if (!product) return null

  const telegramText = encodeURIComponent(
    `Здравствуйте! Хочу заказать: ${product.name} — ${qty} шт.`,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="animate-fade-in absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="animate-scale-in relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background sm:rounded-2xl md:flex-row">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        <div className="relative aspect-square w-full shrink-0 bg-card md:w-1/2">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
          />
          {product.isOnSale && product.discountPercent && (
            <span className="absolute left-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.category}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">{product.name}</h2>

          {/* Price display */}
          {product.isOnSale && product.originalPrice ? (
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-xl font-medium text-destructive">{formatPrice(product.price)}</span>
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            </div>
          ) : (
            <p className="mt-3 text-xl text-foreground">{formatPrice(product.price)}</p>
          )}

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="inline-flex size-10 items-center justify-center text-foreground transition-colors hover:bg-muted"
                aria-label="−"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="inline-flex size-10 items-center justify-center text-foreground transition-colors hover:bg-muted"
                aria-label="+"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatPrice(product.price * qty)}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-6">
            <Button
              size="lg"
              className="h-11"
              onClick={() => {
                addToCart(product, qty)
                onClose()
                setCartOpen(true)
              }}
            >
              <ShoppingBag className="size-4" />
              {t("product.add")}
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11">
              <a
                href={`https://t.me/${TELEGRAM_USERNAME}?text=${telegramText}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="size-4" />
                {t("product.buy")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
