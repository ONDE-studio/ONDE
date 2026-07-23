"use client"

import { useState } from "react"
import { Check, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { useCartUI } from "./cart-ui"
import { Product } from "@/lib/types"

interface Props {
  product: any
}

export function AddToCartButton({ product }: Props) {
  const { addToCart } = useStore()
  const { setOpen } = useCartUI()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    const p: Product = {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      description: product.description || "",
      category: product.category || "декор",
      image: product.images?.[0] || product.image || "/placeholder.svg",
      position: product.position || 0,
      featured: product.featured || false,
      isOnSale: Boolean(product.originalPrice),
      createdAt: product.created_at || new Date().toISOString(),
    }
    addToCart(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    setOpen(true)
  }

  return (
    <Button
      onClick={handleAdd}
      size="lg"
      className="w-full h-12 gap-2 text-sm font-medium rounded-xl transition-all"
    >
      {added ? (
        <>
          <Check className="size-4" />
          Добавлено в корзину
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" />
          Добавить в корзину — {new Intl.NumberFormat("ru-RU").format(product.price)} ₽
        </>
      )}
    </Button>
  )
}
