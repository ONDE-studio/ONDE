"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { CartItem, HeroSettings, Order, OrderMethod, OrderStatus, Product, User } from "./types"
import { defaultHeroSettings, seedOrders, seedProducts, seedUsers } from "./mock-data"

const STORAGE_KEY = "onde-store-v1"
const SESSION_KEY = "onde-session-v1"

interface Persisted {
  products: Product[]
  orders: Order[]
  users: User[]
  heroSettings: HeroSettings
}

interface StoreValue {
  ready: boolean
  products: Product[]
  orders: Order[]
  users: User[]
  cart: CartItem[]
  currentUser: User | null
  heroSettings: HeroSettings
  // cart
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  // auth
  login: (email: string, password: string) => { ok: boolean; error?: string }
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  // orders
  createOrder: (input: {
    method: OrderMethod
    customerName: string
    contact: string
    comment: string
  }) => Order
  updateOrderStatus: (id: string, status: OrderStatus) => void
  // products (admin)
  addProduct: (input: Omit<Product, "id" | "position" | "createdAt">) => void
  updateProduct: (id: string, input: Partial<Product>) => void
  deleteProduct: (id: string) => void
  moveProduct: (id: string, direction: "up" | "down") => void
  // hero (admin)
  updateHeroSettings: (settings: HeroSettings) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return { products: seedProducts, orders: seedOrders, users: seedUsers, heroSettings: defaultHeroSettings }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted
      // Ensure heroSettings exists (migration from old data)
      if (!parsed.heroSettings) parsed.heroSettings = defaultHeroSettings
      // Ensure isOnSale exists on all products (migration)
      parsed.products = parsed.products.map((p) => ({
        ...p,
        isOnSale: p.isOnSale ?? false,
      }))
      return parsed
    }
  } catch {
    // ignore
  }
  return { products: seedProducts, orders: seedOrders, users: seedUsers, heroSettings: defaultHeroSettings }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(defaultHeroSettings)

  // hydrate
  useEffect(() => {
    const data = loadPersisted()
    setProducts(data.products)
    setOrders(data.orders)
    setUsers(data.users)
    setHeroSettings(data.heroSettings)
    try {
      const email = window.localStorage.getItem(SESSION_KEY)
      if (email) {
        const u = data.users.find((x) => x.email === email)
        if (u) setCurrentUser(u)
      }
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  // persist
  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, orders, users, heroSettings }))
    } catch {
      // ignore
    }
  }, [ready, products, orders, users, heroSettings])

  const persistSession = useCallback((email: string | null) => {
    try {
      if (email) window.localStorage.setItem(SESSION_KEY, email)
      else window.localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }, [])

  // ---- cart ----
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.isOnSale ? product.originalPrice : undefined,
          image: product.image,
          quantity,
        },
      ]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const setQuantityFn = useCallback((productId: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.quantity, 0), [cart])
  const cartTotal = useMemo(() => cart.reduce((n, i) => n + i.price * i.quantity, 0), [cart])

  // ---- auth ----
  const login = useCallback(
    (email: string, password: string) => {
      const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (!u) return { ok: false, error: "not_found" }
      if (u.password !== password) return { ok: false, error: "wrong_password" }
      setCurrentUser(u)
      persistSession(u.email)
      return { ok: true }
    },
    [users, persistSession],
  )

  const register = useCallback(
    (name: string, email: string, password: string) => {
      const exists = users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (exists) return { ok: false, error: "exists" }
      const user: User = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "customer",
        createdAt: new Date().toISOString(),
      }
      setUsers((prev) => [...prev, user])
      setCurrentUser(user)
      persistSession(user.email)
      return { ok: true }
    },
    [users, persistSession],
  )

  const logout = useCallback(() => {
    setCurrentUser(null)
    persistSession(null)
  }, [persistSession])

  // ---- orders ----
  const createOrder = useCallback<StoreValue["createOrder"]>(
    (input) => {
      const order: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: cart.reduce((n, i) => n + i.price * i.quantity, 0),
        customerName: input.customerName,
        contact: input.contact,
        comment: input.comment,
        method: input.method,
        status: "new",
        userEmail: currentUser?.email ?? null,
        createdAt: new Date().toISOString(),
      }
      setOrders((prev) => [order, ...prev])
      setCart([])
      return order
    },
    [cart, currentUser],
  )

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }, [])

  // ---- products ----
  const addProduct = useCallback<StoreValue["addProduct"]>((input) => {
    setProducts((prev) => {
      const position = prev.length ? Math.max(...prev.map((p) => p.position)) + 1 : 0
      const product: Product = {
        ...input,
        id: `p-${Date.now().toString(36)}`,
        position,
        createdAt: new Date().toISOString(),
      }
      return [...prev, product]
    })
  }, [])

  const updateProduct = useCallback<StoreValue["updateProduct"]>((id, input) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)))
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const moveProduct = useCallback((id: string, direction: "up" | "down") => {
    setProducts((prev) => {
      const sorted = [...prev].sort((a, b) => a.position - b.position)
      const index = sorted.findIndex((p) => p.id === id)
      if (index === -1) return prev
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= sorted.length) return prev
      const a = sorted[index]
      const b = sorted[swapWith]
      const tmp = a.position
      a.position = b.position
      b.position = tmp
      return [...sorted]
    })
  }, [])

  // ---- hero ----
  const updateHeroSettings = useCallback((settings: HeroSettings) => {
    setHeroSettings(settings)
  }, [])

  const value: StoreValue = {
    ready,
    products,
    orders,
    users,
    cart,
    currentUser,
    heroSettings,
    addToCart,
    removeFromCart,
    setQuantity: setQuantityFn,
    clearCart,
    cartCount,
    cartTotal,
    login,
    register,
    logout,
    createOrder,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    moveProduct,
    updateHeroSettings,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
