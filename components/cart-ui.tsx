"use client"

import { createContext, useContext, useState } from "react"

interface CartUIValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const CartUIContext = createContext<CartUIValue | null>(null)

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <CartUIContext.Provider value={{ open, setOpen }}>{children}</CartUIContext.Provider>
}

export function useCartUI() {
  const ctx = useContext(CartUIContext)
  if (!ctx) throw new Error("useCartUI must be used within CartUIProvider")
  return ctx
}
