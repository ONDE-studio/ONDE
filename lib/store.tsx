"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { CartItem, HeroSettings, Order, OrderMethod, OrderStatus, Product, User } from "./types"
import { defaultHeroSettings, seedOrders, seedProducts, seedUsers } from "./mock-data"
import { supabase } from "./supabase"

const SESSION_KEY = "onde-session-v1"
const CART_KEY = "onde-cart-v1"

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
  }) => Promise<Order>
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>
  // products (admin)
  addProduct: (input: Omit<Product, "id" | "position" | "createdAt">) => Promise<void>
  updateProduct: (id: string, input: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  moveProduct: (id: string, direction: "up" | "down") => Promise<void>
  // hero (admin)
  updateHeroSettings: (settings: HeroSettings) => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(defaultHeroSettings)

  // hydrate from Supabase
  useEffect(() => {
    async function loadData() {
      // Check if Supabase keys are configured (basic check)
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        console.warn("Supabase is not configured. Falling back to mock data.")
        setProducts(seedProducts)
        setOrders(seedOrders)
        setUsers(seedUsers)
        setHeroSettings(defaultHeroSettings)
        setReady(true)
        return
      }

      try {
        const [
          { data: p },
          { data: o },
          { data: u },
          { data: s }
        ] = await Promise.all([
          supabase.from("products").select("*").order("position", { ascending: true }),
          supabase.from("orders").select("*").order("createdAt", { ascending: false }),
          supabase.from("users").select("*"),
          supabase.from("showcase_settings").select("*").eq("id", "hero").single(),
        ])

        if (p) setProducts(p)
        if (o) setOrders(o)
        if (u) setUsers(u)
        if (s) setHeroSettings(s.settings as HeroSettings)
      } catch (err) {
        console.error("Error loading data from Supabase:", err)
      } finally {
        setReady(true)
      }
    }
    loadData()
  }, [])

  // Check saved session & cart
  useEffect(() => {
    if (!ready) return
    try {
      const email = window.localStorage.getItem(SESSION_KEY)
      if (email) {
        const u = users.find((x) => x.email === email)
        if (u) setCurrentUser(u)
      }
      const savedCart = window.localStorage.getItem(CART_KEY)
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch {
      // ignore
    }
  }, [ready, users])

  // Persist cart on change
  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
    } catch {
      // ignore
    }
  }, [cart, ready])

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
    async (email: string, password: string) => {
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
    async (name: string, email: string, password: string) => {
      const exists = users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (exists) return { ok: false, error: "exists" }
      const user: User = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "customer",
        createdAt: new Date().toISOString(),
      }
      
      const { error } = await supabase.from("users").insert([user])
      if (error) {
        console.error("Registration error:", error)
        alert("Ошибка при регистрации: " + error.message)
        return { ok: false, error: "server_error" }
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
  const createOrder = useCallback(
    async (input: { method: OrderMethod; customerName: string; contact: string; comment: string }) => {
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
      
      const { error } = await supabase.from("orders").insert([order])
      if (!error) {
        setOrders((prev) => [order, ...prev])
        setCart([])
      }
      return order
    },
    [cart, currentUser],
  )

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id)
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    }
  }, [])

  // ---- products ----
  const addProduct = useCallback(async (input: Omit<Product, "id" | "position" | "createdAt">) => {
    const position = products.length ? Math.max(...products.map((p) => p.position)) + 1 : 0
    const product: Product = {
      ...input,
      id: `p-${Date.now().toString(36)}`,
      position,
      createdAt: new Date().toISOString(),
    }
    const { error } = await supabase.from("products").insert([product])
    if (error) {
      console.error("Failed to add product", error)
      alert("Ошибка при сохранении товара: " + error.message)
    } else {
      setProducts((prev) => [...prev, product])
    }
  }, [products])

  const updateProduct = useCallback(async (id: string, input: Partial<Product>) => {
    const { error } = await supabase.from("products").update(input).eq("id", id)
    if (error) {
      console.error("Failed to update product", error)
      alert("Ошибка при обновлении товара: " + error.message)
    } else {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)))
    }
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete product", error)
      alert("Ошибка при удалении товара: " + error.message)
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }, [])

  const moveProduct = useCallback(async (id: string, direction: "up" | "down") => {
    const sorted = [...products].sort((a, b) => a.position - b.position)
    const index = sorted.findIndex((p) => p.id === id)
    if (index === -1) return
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= sorted.length) return
    
    const a = sorted[index]
    const b = sorted[swapWith]
    
    // Optimistic update
    setProducts((prev) => {
      const newSorted = [...prev].sort((x, y) => x.position - y.position)
      const tmp = newSorted[index].position
      newSorted[index].position = newSorted[swapWith].position
      newSorted[swapWith].position = tmp
      return newSorted
    })
    
    // Update DB
    const { error: e1 } = await supabase.from("products").update({ position: b.position }).eq("id", a.id)
    const { error: e2 } = await supabase.from("products").update({ position: a.position }).eq("id", b.id)

    if (e1 || e2) {
      console.error("Failed to move product", e1 || e2)
      alert("Ошибка при изменении порядка товаров")
    } else {
      setProducts((prev) => {
        const next = [...prev]
        const ia = next.findIndex((p) => p.id === a.id)
        const ib = next.findIndex((p) => p.id === b.id)
        next[ia] = { ...a, position: b.position }
        next[ib] = { ...b, position: a.position }
        return next
      })
    }
  }, [products])

  // ---- hero ----
  const updateHeroSettings = useCallback(async (settings: HeroSettings) => {
    const { error } = await supabase.from("showcase_settings").upsert({ id: "hero", settings })
    if (!error) {
      setHeroSettings(settings)
    }
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
