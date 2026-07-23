import "server-only"
import { getEnv } from "@/lib/env"

export interface OrderNotificationPayload {
  publicNumber: string
  customerName: string
  contact: string
  address: string
  subtotal: number
  deliveryName: string
  deliveryPrice: number | null
  estimatedTotal: number | null
  requiresDeliveryAgreement?: boolean
  total?: number // legacy compat — use estimatedTotal
  items: Array<{ name: string; quantity: number; price: number }>
  comment?: string | null
}

export async function sendTelegramOrderNotification(payload: OrderNotificationPayload): Promise<boolean> {
  const env = getEnv()

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) {
    console.warn("[telegram] Bot token or chat ID not configured — notification skipped")
    return false
  }

  const itemList = payload.items
    .map((item) => `• ${item.name} × ${item.quantity} = ${item.price * item.quantity} ₽`)
    .join("\n")

  const deliveryLine = payload.requiresDeliveryAgreement || payload.deliveryPrice === null
    ? `🚚 *Доставка (${payload.deliveryName}):* Стоимость согласовывается в Telegram`
    : `🚚 *Доставка (${payload.deliveryName}):* ${payload.deliveryPrice} ₽`

  const totalLine = payload.estimatedTotal !== null && payload.estimatedTotal !== undefined
    ? `💳 *Ориентировочный итог:* ${payload.estimatedTotal} ₽`
    : `💳 *Итог:* Уточняется после согласования доставки`

  const text = `📦 *НОВАЯ ЗАЯВКА* №${payload.publicNumber}

👤 *Покупатель:* ${payload.customerName}
📞 *Контакт:* ${payload.contact}
📍 *Адрес:* ${payload.address}

🛒 *Состав:*
${itemList}

💰 *Сумма товаров:* ${payload.subtotal} ₽
${deliveryLine}
${totalLine}
${payload.comment ? `\n💬 *Комментарий:* ${payload.comment}` : ""}
⚠️ _Требуется подтверждение деталей в Telegram._`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeout)

    if (!res.ok) {
      // Don't log response body — may contain token echo
      console.error("[telegram] Telegram API returned non-OK status:", res.status)
      return false
    }
    return true
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Timeout" : err?.message?.slice(0, 100)
    console.error("[telegram] Send failed:", msg)
    return false
  }
}
