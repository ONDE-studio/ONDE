"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Loader2, Send, ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import { StoreShell } from "@/components/store-shell"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { ShippingQuote } from "@/lib/shipping/types"

export default function CheckoutPage() {
  const { t, formatPrice } = useI18n()
  const { cart, cartTotal, currentUser, clearCart } = useStore()
  const router = useRouter()

  const [name, setName] = useState(currentUser?.name ?? "")
  const [contact, setContact] = useState(currentUser?.email ?? "")
  const [city, setCity] = useState("Екатеринбург")
  const [address, setAddress] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [comment, setComment] = useState("")
  const [termsAgreement, setTermsAgreement] = useState(false)
  const [privacyAgreement, setPrivacyAgreement] = useState(false)

  // Quotes state
  const [quotes, setQuotes] = useState<ShippingQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null)
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchShippingQuotes = async () => {
    if (!city.trim()) {
      setShippingError("Укажите город для расчёта доставки")
      return
    }

    setIsCalculatingShipping(true)
    setShippingError(null)

    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: {
            city: city.trim(),
            address: address.trim(),
            postalCode: postalCode.trim(),
          },
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Не удалось рассчитать варианты доставки")
      }

      setQuotes(data.quotes || [])
      if (data.quotes && data.quotes.length > 0) {
        setSelectedQuote(data.quotes[0])
      }
    } catch (err: any) {
      setShippingError(err.message || " Ошибка соединения при расчёте доставки")
    } finally {
      setIsCalculatingShipping(false)
    }
  }

  const deliveryPrice = selectedQuote?.price || 0
  const estimatedTotal = cartTotal + deliveryPrice
  const canSubmit =
    cart.length > 0 &&
    name.trim().length >= 2 &&
    contact.trim().length >= 3 &&
    address.trim().length >= 5 &&
    selectedQuote !== null &&
    termsAgreement &&
    privacyAgreement &&
    !isSubmitting

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !selectedQuote) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          contact: contact.trim(),
          address: `${city.trim()}, ${address.trim()} ${postalCode.trim() ? `(${postalCode.trim()})` : ""}`,
          comment: comment.trim(),
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryProviderId: selectedQuote.providerId,
          deliveryProviderName: selectedQuote.providerName,
          deliveryServiceCode: selectedQuote.serviceCode,
          deliveryServiceName: selectedQuote.serviceName,
          deliveryPrice: selectedQuote.price,
          deliveryMinDays: selectedQuote.minDays,
          deliveryMaxDays: selectedQuote.maxDays,
          userId: currentUser?.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Не удалось создать заявку")
      }

      clearCart()
      router.push(`/orders/${data.publicNumber || data.orderId}?token=${data.accessToken}`)
    } catch (err: any) {
      setSubmitError(err.message || "Ошибка отправки заявки. Попробуйте еще раз.")
      setIsSubmitting(false)
    }
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
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Назад в магазин
        </button>

        <h1 className="font-serif text-3xl font-medium text-foreground sm:text-4xl">
          Оформление заявки на заказ
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Без онлайн-оплаты. Все детали, точные сроки и способы оплаты подтверждаются в Telegram.
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Main Checkout Form */}
          <form onSubmit={handleSubmitOrder} className="space-y-8">
            {/* Step 1: Contact info */}
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
                    required
                    placeholder="Александр"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground">Телефон или Telegram *</span>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    placeholder="+7 (900) 000-00-00 или @username"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </label>
              </div>
            </section>

            {/* Step 2: Shipping Address & Calculation */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                2. Адрес и Расчёт доставки
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground">Город *</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="Екатеринбург"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs font-medium text-foreground">Улица, дом, квартира *</span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="ул. Малышева, д. 10, кв. 4"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground">Индекс</span>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="620000"
                    className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </label>
                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={fetchShippingQuotes}
                    disabled={isCalculatingShipping || !city.trim()}
                    variant="outline"
                    className="w-full h-11 gap-2 text-xs font-medium rounded-xl"
                  >
                    {isCalculatingShipping ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Запрос тарифов API...
                      </>
                    ) : (
                      <>
                        <Truck className="size-4" />
                        Рассчитать стоимость доставки
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {shippingError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {shippingError}
                </div>
              )}

              {/* Quotes Selection List */}
              {quotes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <span className="text-xs font-medium text-foreground block">Доступные варианты доставки:</span>
                  <div className="grid gap-3">
                    {quotes.map((q) => (
                      <button
                        type="button"
                        key={q.quoteId}
                        onClick={() => setSelectedQuote(q)}
                        className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                          selectedQuote?.quoteId === q.quoteId
                            ? "border-foreground bg-secondary/60 ring-1 ring-foreground"
                            : "border-border bg-background hover:border-foreground/40"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{q.providerName}</span>
                            <span className="text-[10px] uppercase tracking-wider rounded-md bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
                              {q.deliveryType === "courier" ? "Курьер" : q.deliveryType === "pickup" ? "ПВЗ" : "Почта"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{q.serviceName}</p>
                        </div>

                        <div className="text-right">
                          <span className="font-semibold text-sm text-foreground">
                            {q.price > 0 ? `${formatPrice(q.price)}` : "По согласованию"}
                          </span>
                          <p className="text-[10px] text-muted-foreground">{q.minDays}-{q.maxDays} дн.</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Step 3: Comment & Consent */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-serif text-lg font-medium text-foreground border-b border-border pb-3">
                3. Согласование и Подтверждение
              </h2>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">Комментарий к заказу</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Пожелания по цвету, упаковке или времени связи"
                  className="rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors focus:border-foreground"
                />
              </label>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreement}
                    onChange={(e) => setTermsAgreement(e.target.checked)}
                    required
                    className="size-4 rounded border-border accent-foreground cursor-pointer mt-0.5 shrink-0"
                  />
                  <span className="text-xs text-foreground">
                    Я ознакомлен(а) и согласен(на) с{" "}
                    <Link href="/terms" target="_blank" className="underline underline-offset-4 hover:text-muted-foreground">
                      Пользовательским соглашением
                    </Link>{" "}
                    и условиями возврата.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAgreement}
                    onChange={(e) => setPrivacyAgreement(e.target.checked)}
                    required
                    className="size-4 rounded border-border accent-foreground cursor-pointer mt-0.5 shrink-0"
                  />
                  <span className="text-xs text-foreground">
                    Я даю согласие на обработку персональных данных для связи по заказу.
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit}
                className="w-full h-12 gap-2 text-sm font-medium rounded-xl mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Сохранение заявки...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Отправить заявку в ONDE Studio
                  </>
                )}
              </Button>
            </section>
          </form>

          {/* Right Summary Sidebar */}
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
                <span className="font-medium text-foreground">
                  {selectedQuote ? (deliveryPrice > 0 ? formatPrice(deliveryPrice) : "По согласованию") : "Укажите адрес"}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-foreground pt-3 border-t border-border">
                <span>Итого к заявке</span>
                <span className="font-serif text-base">{formatPrice(estimatedTotal)}</span>
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
