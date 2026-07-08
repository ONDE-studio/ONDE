"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Locale } from "./types"

const LOCALE_KEY = "onde-locale-v1"

type Dict = Record<string, { ru: string; en: string }>

const dict: Dict = {
  // nav
  "nav.catalog": { ru: "Каталог", en: "Catalog" },
  "nav.about": { ru: "О студии", en: "About" },
  "nav.process": { ru: "Процесс", en: "Process" },
  "nav.contact": { ru: "Контакты", en: "Contact" },
  "nav.account": { ru: "Кабинет", en: "Account" },
  "nav.admin": { ru: "Админ", en: "Admin" },
  "nav.login": { ru: "Войти", en: "Sign in" },
  "nav.logout": { ru: "Выйти", en: "Sign out" },

  // hero
  "hero.badge": { ru: "Премиальная 3D-печать", en: "Premium 3D printing" },
  "hero.title": {
    ru: "Предметы, напечатанные с характером",
    en: "Objects printed with character",
  },
  "hero.subtitle": {
    ru: "Штучные изделия ручной работы: вазы, свет, арт-объекты и функциональные детали. Спроектированы и напечатаны в студии ONDE.",
    en: "One-of-a-kind handmade pieces: vases, lighting, art objects and functional parts. Designed and printed in the ONDE studio.",
  },
  "hero.cta": { ru: "Смотреть каталог", en: "Explore catalog" },
  "hero.cta2": { ru: "Написать в Telegram", en: "Message on Telegram" },

  // catalog
  "catalog.title": { ru: "Каталог", en: "Catalog" },
  "catalog.subtitle": {
    ru: "Актуальный ассортимент студии. Пополняется вручную.",
    en: "The studio's current range. Updated by hand.",
  },
  "catalog.all": { ru: "Все", en: "All" },
  "catalog.empty": { ru: "Пока нет изделий в этой категории.", en: "No items in this category yet." },
  "catalog.featured": { ru: "Избранное", en: "Featured" },

  // product
  "product.add": { ru: "В корзину", en: "Add to cart" },
  "product.buy": { ru: "Купить в Telegram", en: "Buy on Telegram" },
  "product.details": { ru: "Подробнее", en: "View" },
  "product.sale": { ru: "Скидка", en: "Sale" },
  "product.oldPrice": { ru: "Старая цена", en: "Old price" },
  "product.from": { ru: "от", en: "from" },

  // cart
  "cart.title": { ru: "Корзина", en: "Cart" },
  "cart.empty": { ru: "Корзина пуста", en: "Your cart is empty" },
  "cart.emptyHint": {
    ru: "Добавьте изделия из каталога, чтобы оформить заказ.",
    en: "Add pieces from the catalog to place an order.",
  },
  "cart.total": { ru: "Итого", en: "Total" },
  "cart.checkout": { ru: "Оформить заказ", en: "Checkout" },
  "cart.continue": { ru: "Продолжить покупки", en: "Continue shopping" },
  "cart.remove": { ru: "Удалить", en: "Remove" },

  // checkout
  "checkout.title": { ru: "Оформление заказа", en: "Checkout" },
  "checkout.method": { ru: "Способ оформления", en: "How to order" },
  "checkout.viaAccount": { ru: "Через сайт", en: "On the site" },
  "checkout.viaAccountHint": {
    ru: "Оставьте заявку — заказ появится в вашем кабинете, я свяжусь с вами.",
    en: "Leave a request — the order appears in your account and I'll get in touch.",
  },
  "checkout.viaTelegram": { ru: "Через Telegram", en: "Via Telegram" },
  "checkout.viaTelegramHint": {
    ru: "Откроет мессенджер",
    en: "Opens messenger app",
  },
  "checkout.name": { ru: "Имя", en: "Name" },
  "checkout.contact": { ru: "Контакт (email или @telegram)", en: "Contact (email or @telegram)" },
  "checkout.comment": { ru: "Комментарий к заказу", en: "Order comment" },
  "checkout.submit": { ru: "Отправить заявку", en: "Place order" },
  "checkout.address": { ru: "Адрес доставки", en: "Delivery Address" },
  "checkout.deliveryPayment": { ru: "Способ доставки и оплаты", en: "Delivery & Payment Method" },
  "checkout.agreement": { ru: "С соглашением о покупке соглашаюсь", en: "I agree to the terms of purchase" },
  "checkout.openTelegram": { ru: "Открыть Telegram", en: "Open Telegram" },
  "checkout.summary": { ru: "Ваш заказ", en: "Your order" },
  "checkout.success": { ru: "Заявка принята!", en: "Order received!" },
  "checkout.successHint": {
    ru: "Спасибо. Я свяжусь с вами по указанному контакту.",
    en: "Thank you. I'll reach out via the contact you provided.",
  },
  "checkout.toAccount": { ru: "В личный кабинет", en: "Go to account" },
  "checkout.toHome": { ru: "На главную", en: "Back home" },

  // auth
  "auth.loginTitle": { ru: "Вход", en: "Sign in" },
  "auth.registerTitle": { ru: "Регистрация", en: "Create account" },
  "auth.email": { ru: "Email", en: "Email" },
  "auth.password": { ru: "Пароль", en: "Password" },
  "auth.name": { ru: "Имя", en: "Name" },
  "auth.signin": { ru: "Войти", en: "Sign in" },
  "auth.signup": { ru: "Создать аккаунт", en: "Create account" },
  "auth.noAccount": { ru: "Нет аккаунта?", en: "No account?" },
  "auth.hasAccount": { ru: "Уже есть аккаунт?", en: "Already registered?" },
  "auth.toRegister": { ru: "Зарегистрироваться", en: "Sign up" },
  "auth.toLogin": { ru: "Войти", en: "Sign in" },
  "auth.errNotFound": { ru: "Пользователь не найден", en: "User not found" },
  "auth.errWrong": { ru: "Неверный пароль", en: "Wrong password" },
  "auth.errExists": { ru: "Такой email уже зарегистрирован", en: "This email is already registered" },
  "auth.demoHint": { ru: "Демо-доступы", en: "Demo credentials" },

  // account
  "account.title": { ru: "Личный кабинет", en: "My account" },
  "account.orders": { ru: "Мои заказы", en: "My orders" },
  "account.noOrders": { ru: "У вас пока нет заказов.", en: "You have no orders yet." },
  "account.goCatalog": { ru: "Перейти в каталог", en: "Go to catalog" },

  // admin
  "admin.title": { ru: "Панель управления", en: "Dashboard" },
  "admin.overview": { ru: "Обзор", en: "Overview" },
  "admin.products": { ru: "Товары", en: "Products" },
  "admin.orders": { ru: "Заказы", en: "Orders" },
  "admin.revenue": { ru: "Выручка", en: "Revenue" },
  "admin.ordersCount": { ru: "Заказов", en: "Orders" },
  "admin.productsCount": { ru: "Товаров", en: "Products" },
  "admin.avgCheck": { ru: "Средний чек", en: "Avg order" },
  "admin.salesByMonth": { ru: "Продажи по месяцам", en: "Sales by month" },
  "admin.topProducts": { ru: "Топ изделий", en: "Top products" },
  "admin.recentOrders": { ru: "Последние заказы", en: "Recent orders" },
  "admin.addProduct": { ru: "Добавить товар", en: "Add product" },
  "admin.editProduct": { ru: "Редактирование", en: "Edit product" },
  "admin.newProduct": { ru: "Новый товар", en: "New product" },
  "admin.pName": { ru: "Название", en: "Name" },
  "admin.pCategory": { ru: "Категория", en: "Category" },
  "admin.pPrice": { ru: "Цена, ₽", en: "Price, ₽" },
  "admin.pOriginalPrice": { ru: "Цена без скидки, ₽", en: "Original price, ₽" },
  "admin.pOnSale": { ru: "Товар со скидкой", en: "On sale" },
  "admin.pDiscount": { ru: "Скидка", en: "Discount" },
  "admin.pImage": { ru: "Изображение", en: "Image" },
  "admin.pDescription": { ru: "Описание", en: "Description" },
  "admin.pFeatured": { ru: "Показывать в избранном", en: "Show as featured" },
  "admin.upload": { ru: "Загрузить фото", en: "Upload photo" },
  "admin.orDrop": { ru: "или перетащите файл сюда", en: "or drop a file here" },
  "admin.save": { ru: "Сохранить", en: "Save" },
  "admin.cancel": { ru: "Отмена", en: "Cancel" },
  "admin.create": { ru: "Создать товар", en: "Create product" },
  "admin.edit": { ru: "Изменить", en: "Edit" },
  "admin.delete": { ru: "Удалить", en: "Delete" },
  "admin.confirmDelete": { ru: "Удалить этот товар?", en: "Delete this product?" },
  "admin.moveUp": { ru: "Выше", en: "Move up" },
  "admin.moveDown": { ru: "Ниже", en: "Move down" },
  "admin.order": { ru: "Порядок", en: "Order" },
  "admin.status": { ru: "Статус", en: "Status" },
  "admin.emptyProducts": { ru: "Товаров пока нет. Добавьте первый.", en: "No products yet. Add the first one." },
  "admin.formError": {
    ru: "Заполните название, категорию, цену и добавьте фото.",
    en: "Fill in name, category, price and add a photo.",
  },
  "admin.discountError": {
    ru: "Цена без скидки должна быть больше текущей цены.",
    en: "Original price must be greater than the sale price.",
  },
  "admin.accessDenied": { ru: "Доступ только для администратора.", en: "Admins only." },
  "admin.backToStore": { ru: "На сайт", en: "To store" },
  // showcase
  "admin.showcase": { ru: "Витрина", en: "Showcase" },
  "admin.heroSection": { ru: "Баннер главной", en: "Hero banner" },
  "admin.heroBadge": { ru: "Бейдж", en: "Badge" },
  "admin.heroTitle": { ru: "Заголовок", en: "Title" },
  "admin.heroSubtitle": { ru: "Подзаголовок", en: "Subtitle" },
  "admin.heroPreview": { ru: "Предпросмотр", en: "Preview" },
  "admin.heroSaved": { ru: "Сохранено", en: "Saved" },
  "admin.featuredSection": { ru: "Избранные товары", en: "Featured products" },
  "admin.featuredHint": {
    ru: "Товары с пометкой «Избранное» выделяются на витрине.",
    en: "Products marked as featured are highlighted in the catalog.",
  },
  "admin.onSaleCount": { ru: "Со скидкой", en: "On sale" },

  // status
  "status.new": { ru: "Новый", en: "New" },
  "status.in_progress": { ru: "В работе", en: "In progress" },
  "status.done": { ru: "Выполнен", en: "Done" },
  "status.cancelled": { ru: "Отменён", en: "Cancelled" },

  // footer
  "footer.tagline": {
    ru: "Штучная 3D-печать премиального уровня.",
    en: "One-of-a-kind premium 3D printing.",
  },
  "footer.rights": { ru: "Все права защищены.", en: "All rights reserved." },

  // process
  "process.title": { ru: "Как это работает", en: "How it works" },
  "process.s1t": { ru: "Идея", en: "Idea" },
  "process.s1d": {
    ru: "Выбираете изделие из каталога или описываете задумку в Telegram.",
    en: "Pick a piece from the catalog or describe your idea on Telegram.",
  },
  "process.s2t": { ru: "Печать", en: "Printing" },
  "process.s2d": {
    ru: "Каждая деталь печатается и обрабатывается вручную в студии.",
    en: "Each part is printed and finished by hand in the studio.",
  },
  "process.s3t": { ru: "Доставка", en: "Delivery" },
  "process.s3d": {
    ru: "Аккуратно упаковываю и отправляю в удобный вам сервис.",
    en: "Carefully packed and shipped with your preferred courier.",
  },

  // misc
  "common.currency": { ru: "₽", en: "₽" },
}

type I18nValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: keyof typeof dict | string) => string
  formatPrice: (n: number) => string
  formatDate: (iso: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru")

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_KEY) as Locale | null
      if (saved === "ru" || saved === "en") setLocaleState(saved)
    } catch {
      // ignore
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem(LOCALE_KEY, l)
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback(
    (key: string) => {
      const entry = dict[key]
      if (!entry) return key
      return entry[locale]
    },
    [locale],
  )

  const formatPrice = useCallback(
    (n: number) => {
      return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US").format(n) + " ₽"
    },
    [locale],
  )

  const formatDate = useCallback(
    (iso: string) => {
      return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(iso))
    },
    [locale],
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatPrice, formatDate }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
