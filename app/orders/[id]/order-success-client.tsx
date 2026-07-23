"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, MessageCircle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  order: any
}

export function OrderSuccessClient({ order }: Props) {
  const [copied, setCopied] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  const itemsListText = (order.items_snapshot || [])
    .map((i: any) => `• ${i.name} × ${i.quantity} = ${i.total || i.unitPrice * i.quantity} ₽`)
    .join("\n")

  const telegramMessage = `Здравствуйте! Я оформил(а) заявку №${order.public_number || order.id} на сайте ONDE.

Состав заказа:
${itemsListText}

Сумма товаров: ${order.subtotal} ₽
Доставка (${order.delivery_provider_name || "Согласование"}): ${order.delivery_price > 0 ? `${order.delivery_price} ₽` : "Рассчитывается куратором"}
Ориентировочный итог: ${order.estimated_total || order.subtotal + (order.delivery_price || 0)} ₽

Контакт: ${order.customer_name} (${order.contact})
Адрес: ${order.recipient_address}

Прошу подтвердить наличие, срок изготовления, окончательную стоимость и способ оплаты.`

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(telegramMessage)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } else {
        setShowFallback(true)
      }
    } catch {
      setShowFallback(true)
    }
  }

  const handleOpenTelegram = () => {
    const username = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "onde_studio"
    window.open(`https://t.me/${username}?text=${encodeURIComponent(telegramMessage)}`, "_blank")
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 border-b border-border pb-6">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
          <Check className="size-7" />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground block">
          Заявка успешно зарегистрирована
        </span>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Заявка № {order.public_number || order.id}
        </h1>
        <p className="text-xs text-muted-foreground">
          Создана {new Date(order.created_at).toLocaleString("ru-RU")}
        </p>
      </div>

      {/* Alert banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
        <ShieldAlert className="size-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="font-semibold">Оплата и подтверждение заказа</p>
          <p className="mt-1">
            На сайте нет онлайн-оплаты. Все детали заказа, точные сроки изготовления и способ оплаты согласовываются персонально в Telegram.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-medium text-foreground">Состав заявки</h2>
        <div className="rounded-2xl border border-border divide-y divide-border bg-background/50">
          {(order.items_snapshot || []).map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center p-3.5 text-xs">
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-muted-foreground">
                  {item.quantity} × {item.unitPrice} ₽
                </p>
              </div>
              <span className="font-semibold text-foreground">{item.total || item.unitPrice * item.quantity} ₽</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Стоимость товаров</span>
            <span className="font-medium text-foreground">{order.subtotal} ₽</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Доставка ({order.delivery_provider_name})</span>
            <span className="font-medium text-foreground">
              {order.delivery_price > 0 ? `${order.delivery_price} ₽` : "Уточняется в Telegram"}
            </span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-foreground pt-2 border-t border-border">
            <span>Ориентировочный итог</span>
            <span className="font-serif text-base">{order.estimated_total || order.subtotal + (order.delivery_price || 0)} ₽</span>
          </div>
        </div>
      </div>

      {/* Telegram Actions */}
      <div className="space-y-3 pt-4 border-t border-border">
        <Button onClick={handleOpenTelegram} size="lg" className="w-full h-12 gap-2 text-sm font-medium rounded-xl">
          <MessageCircle className="size-4" />
          Перейти к согласованию в Telegram
          <ExternalLink className="size-3.5 opacity-70" />
        </Button>

        <Button
          onClick={handleCopy}
          variant="outline"
          size="lg"
          className="w-full h-11 gap-2 text-xs font-medium rounded-xl"
        >
          {copied ? (
            <>
              <Check className="size-4 text-emerald-600" />
              Текст скопирован в буфер!
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Скопировать детали заказа
            </>
          )}
        </Button>
      </div>

      {/* Fallback Message Area */}
      {showFallback && (
        <div className="space-y-2 pt-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Скопируйте текст вручную:
          </label>
          <textarea
            readOnly
            value={telegramMessage}
            rows={6}
            className="w-full rounded-xl border border-border bg-muted p-3 text-xs font-mono outline-none"
          />
        </div>
      )}
    </div>
  )
}
