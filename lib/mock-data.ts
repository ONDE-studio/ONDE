import type { HeroSettings, Order, Product, User } from "./types"

export const seedProducts: Product[] = [
  {
    id: "p-vase",
    name: "Ваза «Onda»",
    description:
      "Скульптурная ваза с волнистыми рёбрами, напечатанная матовым био-пластиком. Каждая линия выверена вручную для мягкой игры света.",
    category: "Декор",
    price: 4900,
    isOnSale: false,
    image: "/products/vase.png",
    position: 0,
    featured: true,
    createdAt: "2025-11-02T10:00:00.000Z",
  },
  {
    id: "p-lamp",
    name: "Светильник «Spiral»",
    description:
      "Параметрический абажур со спиральной решёткой. Тёплый рассеянный свет и невесомая геометрия для вечернего интерьера.",
    category: "Свет",
    price: 6960,
    originalPrice: 8700,
    discountPercent: 20,
    isOnSale: true,
    image: "/products/lamp.png",
    position: 1,
    featured: true,
    createdAt: "2025-11-08T10:00:00.000Z",
  },
  {
    id: "p-sculpture",
    name: "Объект «Wave»",
    description:
      "Абстрактная волновая скульптура с гладкими органическими изгибами. Штучный арт-объект для стола или полки.",
    category: "Арт",
    price: 6400,
    isOnSale: false,
    image: "/products/sculpture.png",
    position: 2,
    featured: true,
    createdAt: "2025-11-14T10:00:00.000Z",
  },
  {
    id: "p-organizer",
    name: "Органайзер «Grid»",
    description:
      "Минималистичный настольный органайзер с чёткими геометрическими отсеками. Матовый графит, приятная тактильность.",
    category: "Рабочий стол",
    price: 3200,
    isOnSale: false,
    image: "/products/organizer.png",
    position: 3,
    featured: false,
    createdAt: "2025-11-20T10:00:00.000Z",
  },
  {
    id: "p-planter",
    name: "Кашпо «Facet»",
    description:
      "Гранёное кашпо в бетонно-сером тоне. Дренаж и поддон в комплекте — для суккулентов и небольших растений.",
    category: "Декор",
    price: 1950,
    originalPrice: 2600,
    discountPercent: 25,
    isOnSale: true,
    image: "/products/planter.png",
    position: 4,
    featured: false,
    createdAt: "2025-11-26T10:00:00.000Z",
  },
  {
    id: "p-chess",
    name: "Фигура «Knight»",
    description:
      "Коллекционный шахматный конь в современной параметрической пластике. Матовый чёрный, коллекционное качество печати.",
    category: "Арт",
    price: 3900,
    isOnSale: false,
    image: "/products/chess.png",
    position: 5,
    featured: false,
    createdAt: "2025-12-01T10:00:00.000Z",
  },
]

export const seedUsers: User[] = [
  {
    email: "admin@onde.studio",
    name: "ONDE Admin",
    password: "admin123",
    role: "admin",
    createdAt: "2025-10-01T10:00:00.000Z",
  },
  {
    email: "client@example.com",
    name: "Алексей",
    password: "client123",
    role: "customer",
    createdAt: "2025-11-05T10:00:00.000Z",
  },
]

export const seedOrders: Order[] = [
  {
    id: "ORD-1042",
    items: [{ productId: "p-vase", name: "Ваза «Onda»", price: 4900, quantity: 1 }],
    total: 4900,
    customerName: "Алексей",
    contact: "client@example.com",
    comment: "",
    method: "account",
    status: "done",
    userEmail: "client@example.com",
    createdAt: "2025-11-18T14:20:00.000Z",
  },
  {
    id: "ORD-1043",
    items: [
      { productId: "p-lamp", name: "Светильник «Spiral»", price: 8700, quantity: 1 },
      { productId: "p-planter", name: "Кашпо «Facet»", price: 2600, quantity: 2 },
    ],
    total: 13900,
    customerName: "Мария",
    contact: "@maria_tg",
    comment: "Хочу белый цвет кашпо, если можно.",
    method: "telegram",
    status: "in_progress",
    userEmail: null,
    createdAt: "2025-12-02T09:10:00.000Z",
  },
  {
    id: "ORD-1044",
    items: [{ productId: "p-sculpture", name: "Объект «Wave»", price: 6400, quantity: 1 }],
    total: 6400,
    customerName: "Алексей",
    contact: "client@example.com",
    comment: "Подарок, нужна упаковка.",
    method: "account",
    status: "new",
    userEmail: "client@example.com",
    createdAt: "2025-12-04T17:45:00.000Z",
  },
  {
    id: "ORD-1045",
    items: [{ productId: "p-chess", name: "Фигура «Knight»", price: 3900, quantity: 2 }],
    total: 7800,
    customerName: "Дмитрий",
    contact: "@dmitry_play",
    comment: "",
    method: "telegram",
    status: "done",
    userEmail: null,
    createdAt: "2025-12-06T11:30:00.000Z",
  },
]

export const defaultHeroSettings: HeroSettings = {
  badge: { ru: "Премиальная 3D-печать", en: "Premium 3D printing" },
  title: {
    ru: "Предметы, напечатанные с характером",
    en: "Objects printed with character",
  },
  subtitle: {
    ru: "Штучные изделия ручной работы: вазы, свет, арт-объекты и функциональные детали. Спроектированы и напечатаны в студии ONDE.",
    en: "One-of-a-kind handmade pieces: vases, lighting, art objects and functional parts. Designed and printed in the ONDE studio.",
  },
}

/** Change to your real Telegram handle */
export const TELEGRAM_USERNAME = "onde_studio"
