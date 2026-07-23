export type Locale = "ru" | "en"

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  /** Original price before discount */
  originalPrice?: number
  /** Discount percentage (auto-calculated) */
  discountPercent?: number
  /** Whether product is currently on sale */
  isOnSale: boolean
  image: string
  /** Manual sort order — lower shows first */
  position: number
  featured: boolean
  createdAt: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  /** Original price before discount (for display) */
  originalPrice?: number
  image: string
  quantity: number
}

export interface HeroSettings {
  badge: { ru: string; en: string }
  title: { ru: string; en: string }
  subtitle: { ru: string; en: string }
}

export type OrderMethod = "account" | "telegram"
export type OrderStatus = "new" | "in_progress" | "done" | "cancelled"

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  total: number
  customerName: string
  contact: string
  comment: string
  method: OrderMethod
  status: OrderStatus
  userEmail: string | null
  createdAt: string
}

export type Role = "customer" | "admin"

export interface User {
  id?: string
  email: string
  name: string
  password?: string
  role: Role
  createdAt?: string
}
