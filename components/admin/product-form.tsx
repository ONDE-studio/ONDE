"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "./image-upload"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import type { Product } from "@/lib/types"

interface Props {
  product?: Product
  onDone: () => void
}

export function ProductForm({ product, onDone }: Props) {
  const { addProduct, updateProduct } = useStore()
  const { t } = useI18n()

  const [name, setName] = useState(product?.name ?? "")
  const [category, setCategory] = useState(product?.category ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [image, setImage] = useState(product?.image ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [featured, setFeatured] = useState(product?.featured ?? false)
  const [isOnSale, setIsOnSale] = useState(product?.isOnSale ?? false)
  const [originalPrice, setOriginalPrice] = useState(
    product?.originalPrice ? String(product.originalPrice) : "",
  )
  const [error, setError] = useState("")

  const discountPercent = useMemo(() => {
    const p = Number(price)
    const op = Number(originalPrice)
    if (!isOnSale || !op || !p || op <= p) return 0
    return Math.round(((op - p) / op) * 100)
  }, [price, originalPrice, isOnSale])

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/50"
  const labelClass = "mb-1.5 block text-sm font-medium"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !category.trim() || !price || !image) {
      setError(t("admin.formError") || "Заполните название, категорию, цену и добавьте фото.")
      return
    }
    if (isOnSale && Number(originalPrice) <= Number(price)) {
      setError(t("admin.discountError") || "Цена без скидки должна быть больше текущей цены.")
      return
    }
    const payload = {
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      image,
      description: description.trim(),
      featured,
      isOnSale,
      originalPrice: isOnSale ? Number(originalPrice) : undefined,
      discountPercent: isOnSale ? discountPercent : undefined,
    }
    if (product) {
      updateProduct(product.id, payload)
    } else {
      addProduct(payload)
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <label className={labelClass}>{t("admin.pImage")}</label>
        <ImageUpload value={image} onChange={setImage} />
      </div>

      <div className="order-1 flex flex-col gap-4 md:order-2">
        <div>
          <label className={labelClass} htmlFor="p-name">
            {t("admin.pName")}
          </label>
          <input
            id="p-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваза «Onda»"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="p-cat">
              {t("admin.pCategory")}
            </label>
            <input
              id="p-cat"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Декор"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="p-price">
              {t("admin.pPrice")}
            </label>
            <input
              id="p-price"
              type="number"
              min="0"
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="4900"
            />
          </div>
        </div>

        {/* Discount section */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isOnSale}
              onChange={(e) => setIsOnSale(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-foreground"
            />
            <span className="text-sm font-medium">{t("admin.pOnSale")}</span>
          </label>

          {isOnSale && (
            <div className="mt-3 flex items-end gap-4">
              <div className="flex-1">
                <label className={labelClass} htmlFor="p-original-price">
                  {t("admin.pOriginalPrice")}
                </label>
                <input
                  id="p-original-price"
                  type="number"
                  min="0"
                  className={inputClass}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="8700"
                />
              </div>
              {discountPercent > 0 && (
                <div className="flex h-[42px] items-center rounded-lg bg-destructive/10 px-3">
                  <span className="text-sm font-semibold text-destructive">
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="p-desc">
            {t("admin.pDescription")}
          </label>
          <textarea
            id="p-desc"
            rows={4}
            className={`${inputClass} resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-foreground"
          />
          <span className="text-sm">{t("admin.pFeatured")}</span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="mt-2 flex gap-3">
          <Button type="submit">{product ? t("admin.save") : t("admin.create")}</Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            {t("admin.cancel")}
          </Button>
        </div>
      </div>
    </form>
  )
}
