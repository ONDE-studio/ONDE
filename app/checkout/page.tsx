"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, ChevronRight, MessageCircle, Package, Send, ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import { StoreShell } from "@/components/store-shell"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"

const TELEGRAM_USERNAME = "onde_studio"

const DELIVERY_OPTIONS = [
  { id: "cdek", label: "СДЭК", sub: "ПВЗ или курьер по всей России" },
  { id: "yandex", label: "Яндекс Доставка", sub: "Курьером или до ПВЗ" },
  { id: "pochta", label: "Почта России", sub: "До отделения или курьером" },
  { id: "ozon", label: "Ozon / Авито Доставка", sub: "До ПВЗ или пункта выдачи" },
  { id: "custom", label: "Другая служба / Самовывоз", sub: "Обсудим в Telegram" },
]

const PAYMENT_OPTIONS = [
  { id: "card", label: "Банковская карта", sub: "По реквизитам или QR" },
  { id: "sbp", label: "СБП (Система быстрых платежей)", sub: "Перевод по номеру телефона" },
  { id: "cash", label: "Наличные", sub: "При самовывозе или курьеру" },
  { id: "crypto", label: "Крипто / другое", sub: "Уточним в Telegram" },
]

type Step = "form" | "confirm" | "send"

export default function CheckoutPage() {
  const { formatPrice } = useI18n()
  const { cart, cartTotal, currentUser, clearCart } = useStore()
  const router = useRouter()

  const [step, setStep] = useState<Step>("form")

  // Form fields
  const [name, setName] = useState(currentUser?.name ?? "")
  const [contact, setContact] = useState(currentUser?.email ?? "")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [delivery, setDelivery] = useState("")
  const [payment, setPayment] = useState("")
  const [comment, setComment] = useState("")

  const canConfirm =
    name.trim().length >= 2 &&
    contact.trim().length >= 3 &&
    city.trim().length >= 2 &&
    address.trim().length >= 3 &&
    delivery !== ""

  const canSend = canConfirm && payment !== ""

  function buildTelegramMessage() {
    const itemLines = cart
      .map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
      .join("\n")

    const deliveryLabel = DELIVERY_OPTIONS.find((d) => d.id === delivery)?.label ?? delivery
    const paymentLabel = PAYMENT_OPTIONS.find((p) => p.id === payment)?.label ?? payment

    const lines = [
      "🛍 Новая заявка с сайта ONDE Studio",
      "",
      `👤 Имя: ${name.trim()}`,
      `📞 Контакт: ${contact.trim()}`,
      `📍 Адрес: ${city.trim()}, ${address.trim()}`,
      `🚚 Доставка: ${deliveryLabel}`,
      `💳 Оплата: ${paymentLabel}`,
      "",
      "📦 Состав заказа:",
      itemLines,
      "",
      `💰 Итого (без доставки): ${formatPrice(cartTotal)}`,
      comment.trim() ? `\n💬 Комментарий: ${comment.trim()}` : "",
    ]
      .filter((l) => l !== undefined)
      .join("\n")

    return lines
  }

  function handleSendToTelegram() {
    const msg = buildTelegramMessage()
    const encoded = encodeURIComponent(msg)
    const url = `https://t.me/${TELEGRAM_USERNAME}?text=${encoded}`
    clearCart()
    window.open(url, "_blank", "noopener,noreferrer")
    router.push("/")
  }

  if (cart.length === 0) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-muted mb-4">
            <ShoppingBag className="size-6 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">Ваша корзина пуста</h1>
          <p className="mt-2 text-sm text-muted-foreground">Выберите товары из нашего каталога для оформления заявки.</p>
          <Button asChild className="mt-6">
            <Link href="/#catalog">Перейти в каталог</Link>
          </Button>
        </div>
      </StoreShell>
    )
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <button
          type="button"
          onClick={() => step === "form" ? router.back() : setStep("form")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          {step === "form" ? "Назад в магазин" : "Изменить данные"}
        </button>

        <h1 className="font-serif text-3xl font-medium text-foreground sm:text-4xl">
          Оформление заявки
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Без онлайн-оплаты. Все детали и способы оплаты согласовываются в Telegram.
        </p>

        {/* Progress steps */}
        <div className="mt-6 flex items-center gap-2 text-xs font-medium">
          {(["form", "confirm", "send"] as Step[]).map((s, i) => {
            const labels = ["Данные", "Подтверждение", "Отправить"]
            const active = step === s
            const done =
              (s === "form" && (step === "confirm" || step === "send")) ||
              (s === "confirm" && step === "send")
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    done
                      ? "bg-foreground text-background"
                      : active
                      ? "bg-foreground text-background ring-2 ring-foreground ring-offset-2"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3" /> : i + 1}
                </div>
                <span className={active ? "text-foreground" : "text-muted-foreground"}>{labels[i]}</span>
                {i < 2 && <ChevronRight className="size-3 text-muted-foreground" />}
              </div>
            )
          })}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ─── STEP 1: Form ─── */}
          {step === "form" && (
            <div className="space-y-6">
              {/* Contact */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                  1. Контактные данные
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-foreground">Ваше имя *</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Александр"
                      className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-foreground">Телефон или Telegram *</span>
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+7 (900) 000-00-00 или @username"
                      className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                </div>
              </section>

              {/* Address */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                  2. Адрес доставки
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-foreground">Город *</span>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Москва"
                      className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-xs font-medium text-foreground">Улица, дом, квартира *</span>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="ул. Малышева, д. 10, кв. 4"
                      className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                </div>
              </section>

              {/* Delivery */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                  3. Способ доставки
                </h2>
                <div className="grid gap-2">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setDelivery(opt.id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        delivery === opt.id
                          ? "border-foreground bg-secondary/60 ring-1 ring-foreground"
                          : "border-border bg-background hover:border-foreground/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="size-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">{opt.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 pl-6">{opt.sub}</p>
                      </div>
                      {delivery === opt.id && (
                        <Check className="size-4 text-foreground shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Comment */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                  4. Комментарий (необязательно)
                </h2>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Пожелания по цвету, упаковке или времени связи"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors focus:border-foreground"
                />
              </section>

              <Button
                type="button"
                size="lg"
                disabled={!canConfirm}
                onClick={() => setStep("confirm")}
                className="w-full h-12 gap-2 text-sm font-medium rounded-xl"
              >
                Подтвердить данные
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}

          {/* ─── STEP 2: Confirm + Payment ─── */}
          {step === "confirm" && (
            <div className="space-y-6">
              {/* Summary */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                  Проверьте данные
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Имя</span>
                    <span className="text-foreground font-medium">{name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Контакт</span>
                    <span className="text-foreground font-medium">{contact}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Адрес</span>
                    <span className="text-foreground font-medium">{city}, {address}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Доставка</span>
                    <span className="text-foreground font-medium">
                      {DELIVERY_OPTIONS.find((d) => d.id === delivery)?.label}
                    </span>
                  </div>
                  {comment && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-28 shrink-0">Комментарий</span>
                      <span className="text-foreground">{comment}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment selection */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                  Удобный способ оплаты
                </h2>
                <p className="text-xs text-muted-foreground">
                  Оплата происходит после подтверждения заказа в Telegram — не сейчас.
                </p>
                <div className="grid gap-2">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setPayment(opt.id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        payment === opt.id
                          ? "border-foreground bg-secondary/60 ring-1 ring-foreground"
                          : "border-border bg-background hover:border-foreground/40"
                      }`}
                    >
                      <div>
                        <span className="font-medium text-sm text-foreground">{opt.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                      </div>
                      {payment === opt.id && (
                        <Check className="size-4 text-foreground shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              <Button
                type="button"
                size="lg"
                disabled={!canSend}
                onClick={handleSendToTelegram}
                className="w-full h-12 gap-2 text-sm font-medium rounded-xl bg-[#229ED9] hover:bg-[#1a8bbf] text-white"
              >
                <MessageCircle className="size-4" />
                Отправить заявку в Telegram
              </Button>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                Нажав кнопку, вы перейдёте в Telegram с уже заполненным сообщением.
                Просто нажмите «Отправить» в чате.
              </p>
            </div>
          )}

          {/* ─── Right sidebar ─── */}
          <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24 space-y-6">
            <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
              Ваш заказ
            </h2>

            <ul className="divide-y divide-border">
              {cart.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="truncate font-medium text-foreground">{item.name}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-border pt-4 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Товары ({cart.length})</span>
                <span className="font-medium text-foreground">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Доставка</span>
                <span className="font-medium text-foreground">По согласованию</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-foreground pt-3 border-t border-border">
                <span>Итого к заявке</span>
                <span className="font-serif text-base">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/50 p-4 text-[11px] leading-relaxed text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="size-4 shrink-0 text-foreground/70 mt-0.5" />
              <span>
                Оплата совершается после подтверждения наличия, точного цвета и сроков изготовления в Telegram.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </StoreShell>
  )
}
