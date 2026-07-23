import "server-only"
import { getEnv } from "@/lib/env"

export interface OrderNotificationPayload {
  publicNumber: string
  customerName: string
  contact: string
  address: string
  subtotal: number
  deliveryName: string
  deliveryPrice: number
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
  comment?: string
}

export async function sendTelegramOrderNotification(payload: OrderNotificationPayload): Promise<boolean> {
  const env = getEnv()

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) {
    console.warn("⚠️ Telegram Bot Token or Admin Chat ID not configured. Notification skipped.")
    return false
  }

  const itemList = payload.items
    .map((item) => `• ${item.name} × ${item.quantity} = ${item.price * item.quantity} ₽`)
    .join("\n")

  const text = `📦 *НОВАЯ ЗАЯВКА НА ЗАКАЗ* №${payload.publicNumber}

👤 *Покупатель:* ${payload.customerName}
📞 *Контакт:* ${payload.contact}
📍 *Адрес:* ${payload.address}

🛒 *Состав заказа:*
${itemList}

💰 *Сумма товаров:* ${payload.subtotal} ₽
🚚 *Доставка (${payload.deliveryName}):* ${payload.deliveryPrice > 0 ? `${payload.deliveryPrice} ₽` : "Согласование"}
💳 *Итого к согласованию:* ${payload.total} ₽

${payload.comment ? `💬 *Комментарий:* ${payload.comment}\n` : ""}
⚠️ _Заявка требует подтверждения в Telegram._`

  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("Telegram Bot API error:", await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error("Failed to send Telegram notification:", err)
    return false
  }
}
