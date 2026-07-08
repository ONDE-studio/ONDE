"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Check, Send, ShoppingBag } from "lucide-react"
import { StoreShell } from "@/components/store-shell"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import type { OrderMethod } from "@/lib/types"
import { TELEGRAM_USERNAME } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function CheckoutPage() {
  const { t, formatPrice, locale } = useI18n()
  const { cart, cartTotal, currentUser, createOrder } = useStore()
  const router = useRouter()

  const [method, setMethod] = useState<OrderMethod>("telegram")
  const [name, setName] = useState(currentUser?.name ?? "")
  const [address, setAddress] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState("cdek")
  const [agreement, setAgreement] = useState(false)
  const [contact, setContact] = useState(currentUser?.email ?? "")
  const [comment, setComment] = useState("")
  const [done, setDone] = useState(false)

  const DELIVERY_FEE = 350
  const FREE_DELIVERY_THRESHOLD = 3500

  const needsDeliveryFee = cartTotal > 0 && cartTotal < FREE_DELIVERY_THRESHOLD
  const deliveryCost = needsDeliveryFee ? DELIVERY_FEE : 0
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - cartTotal
  const finalTotal = cartTotal + deliveryCost

  const canSubmit = cart.length > 0 && name.trim() && address.trim() && agreement

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const summary = cart
      .map((i) => `• ${i.name} × ${i.quantity} — ${i.price * i.quantity} ₽`)
      .join("\n")
    createOrder({ method, customerName: name.trim(), contact: contact.trim() || "-", comment: comment.trim() })
    if (method === "telegram") {
      const deliveryName = deliveryMethod === "cdek" ? "СДЭК" : deliveryMethod === "post" ? "Почта России" : "Яндекс.Доставка"
      const text = encodeURIComponent(
        `Здравствуйте! Я хочу оформить заказ:\n\n${summary}\n\nСумма товаров: ${cartTotal} ₽\nДоставка (${deliveryName}): ${deliveryCost} ₽\nИтого к оплате: ${finalTotal} ₽\n\nМой адрес: ${address}\n\nС Пользовательским соглашением ознакомлен(а) и согласен(на).`
      )
      window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${text}`, "_blank")
    }
    setDone(true)
  }

  if (done) {
    return (
      <StoreShell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
          <div className="animate-scale-in inline-flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-8" />
          </div>
          <h1 className="mt-6 font-serif text-3xl text-foreground">{t("checkout.success")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("checkout.successHint")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {currentUser ? (
              <Button asChild size="lg" className="h-11">
                <Link href="/account">{t("checkout.toAccount")}</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link href="/">{t("checkout.toHome")}</Link>
            </Button>
          </div>
        </div>
      </StoreShell>
    )
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("cart.continue")}
        </button>
        <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">
          {t("checkout.title")}
        </h1>

        {cart.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-6 text-muted-foreground" />
            </div>
            <p className="font-serif text-lg text-foreground">{t("cart.empty")}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/#catalog">{t("catalog.title")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <fieldset>
                <legend className="text-sm font-medium text-foreground">
                  {t("checkout.method")}
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      { key: "account", title: "checkout.viaAccount", hint: "checkout.viaAccountHint" },
                      { key: "telegram", title: "checkout.viaTelegram", hint: "checkout.viaTelegramHint" },
                    ] as const
                  ).map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        method === m.key
                          ? "border-foreground bg-secondary/60 ring-1 ring-foreground"
                          : "border-border bg-card hover:border-foreground/40",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{t(m.title)}</span>
                        <span
                          className={cn(
                            "inline-flex size-4 items-center justify-center rounded-full border",
                            method === m.key ? "border-foreground bg-foreground" : "border-border",
                          )}
                        >
                          {method === m.key ? (
                            <Check className="size-3 text-background" />
                          ) : null}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        {t(m.hint)}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{t("checkout.name")}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-lg border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{t("checkout.address")}</span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Город, улица, дом, индекс"
                    className="h-11 rounded-lg border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">Служба доставки</span>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="h-11 rounded-lg border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground"
                  >
                    <option value="cdek">СДЭК (до пункта выдачи)</option>
                    <option value="post">Почта России</option>
                    <option value="yandex">Яндекс.Доставка (курьер)</option>
                  </select>
                </label>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreement}
                    onChange={(e) => setAgreement(e.target.checked)}
                    required
                    className="size-5 rounded border-border accent-foreground cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-foreground">
                    Я соглашаюсь с{" "}
                    <Link href="/terms" target="_blank" className="underline underline-offset-4 hover:text-muted-foreground">
                      пользовательским соглашением
                    </Link>
                    , правилами доставки и возврата
                  </span>
                </label>
              </div>

              <Button type="submit" size="lg" disabled={!canSubmit} className="h-11">
                {method === "telegram" ? (
                  <>
                    <Send className="size-4" />
                    {t("checkout.openTelegram")}
                  </>
                ) : (
                  t("checkout.submit")
                )}
              </Button>
            </form>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
              <h2 className="font-serif text-lg text-foreground">{t("checkout.summary")}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {cart.map((i) => (
                  <li key={i.productId} className="flex items-center gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={i.image || "/placeholder.svg"}
                        alt={i.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.quantity} × {formatPrice(i.price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {formatPrice(i.price * i.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Товары</span>
                  <span className="font-medium text-foreground">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Доставка</span>
                  <span className="font-medium text-foreground">
                    {deliveryCost === 0 ? "Бесплатно" : formatPrice(deliveryCost)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-medium text-foreground">{t("cart.total")}</span>
                  <span className="font-serif text-xl text-foreground">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {needsDeliveryFee && (
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                  <p className="text-sm font-medium text-primary">
                    До бесплатной доставки осталось {formatPrice(remainingForFreeDelivery)}!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Добавьте еще что-нибудь в корзину, чтобы сэкономить {formatPrice(DELIVERY_FEE)} на доставке.
                  </p>
                  <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
                    <Link href="/#catalog">Вернуться в каталог &rarr;</Link>
                  </Button>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </StoreShell>
  )
}
