"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useCartUI } from "./cart-ui"
import { cn } from "@/lib/utils"

export function CartDrawer() {
  const { t, formatPrice } = useI18n()
  const { cart, setQuantity, removeFromCart, cartTotal } = useStore()
  const { open, setOpen } = useCartUI()



  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, setOpen])

  return (
    <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div
        className={cn(
          "absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-label={t("cart.title")}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-serif text-xl text-foreground">
            <ShoppingBag className="size-5" />
            {t("cart.title")}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="inline-flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-6 text-muted-foreground" />
            </div>
            <p className="font-serif text-lg text-foreground">{t("cart.empty")}</p>
            <p className="max-w-xs text-sm text-muted-foreground">{t("cart.emptyHint")}</p>
            <Button variant="outline" onClick={() => setOpen(false)} className="mt-2">
              {t("cart.continue")}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-4">
                {cart.map((item) => (
                  <li key={item.productId} className="flex gap-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-serif text-base text-foreground">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          aria-label={t("cart.remove")}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {/* Price — show sale if originalPrice present */}
                      {item.originalPrice ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-destructive">{formatPrice(item.price)}</span>
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(item.originalPrice)}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                            className="inline-flex size-8 items-center justify-center text-foreground transition-colors hover:bg-muted"
                            aria-label="−"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            className="inline-flex size-8 items-center justify-center text-foreground transition-colors hover:bg-muted"
                            aria-label="+"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-5 py-4">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground">
                  Стоимость доставки рассчитывается и согласовывается в Telegram после оформления заявки.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("cart.total")}</span>
                <span className="font-serif text-xl text-foreground">{formatPrice(cartTotal)}</span>
              </div>
              <Button asChild size="lg" className="mt-4 h-11 w-full">
                <Link href="/checkout" onClick={() => setOpen(false)}>
                  {t("cart.checkout")}
                </Link>
              </Button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("cart.continue")}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
