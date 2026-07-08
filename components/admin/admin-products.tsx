"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductForm } from "./product-form"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import type { Product } from "@/lib/types"

type Mode = { type: "list" } | { type: "new" } | { type: "edit"; product: Product }

export function AdminProducts() {
  const { products, deleteProduct, moveProduct } = useStore()
  const { t, formatPrice } = useI18n()
  const [mode, setMode] = useState<Mode>({ type: "list" })
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.position - b.position),
    [products],
  )

  if (mode.type !== "list") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-6 font-serif text-2xl font-medium tracking-tight">
          {mode.type === "new" ? t("admin.newProduct") : t("admin.editProduct")}
        </h2>
        <ProductForm
          product={mode.type === "edit" ? mode.product : undefined}
          onDone={() => setMode({ type: "list" })}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("admin.order")} · {sorted.length}
        </p>
        <Button onClick={() => setMode({ type: "new" })}>
          <Plus className="h-4 w-4" />
          {t("admin.addProduct")}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {t("admin.emptyProducts")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((p, index) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-foreground/25"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveProduct(p.id, "up")}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                  aria-label={t("admin.moveUp")}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === sorted.length - 1}
                  onClick={() => moveProduct(p.id, "down")}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                  aria-label={t("admin.moveDown")}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={p.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="64px" />
                {p.isOnSale && p.discountPercent && (
                  <span className="absolute left-0 top-0 rounded-br-lg bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                    -{p.discountPercent}%
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{p.name}</p>
                  {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-foreground text-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">{p.category}</p>
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                {p.isOnSale && p.originalPrice ? (
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(p.originalPrice)}
                    </span>
                    <span className="font-medium text-destructive">{formatPrice(p.price)}</span>
                  </div>
                ) : (
                  <span className="font-medium">{formatPrice(p.price)}</span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode({ type: "edit", product: p })}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label={t("admin.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(p.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("admin.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* delete confirm */}
      {confirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 animate-fade-in"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-medium">{t("admin.confirmDelete")}</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmId(null)}>
                {t("admin.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteProduct(confirmId)
                  setConfirmId(null)
                }}
              >
                {t("admin.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
