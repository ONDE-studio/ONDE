import { ShippingProvider, ShippingQuote, ShippingQuoteInput } from "./types"

export class TelegramManualProvider implements ShippingProvider {
  id = "telegram_manual"
  name = "Согласование в Telegram"

  isConfigured(): boolean {
    return true // Always available as fallback
  }

  async getQuotes(_input: ShippingQuoteInput): Promise<ShippingQuote[]> {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    return [
      {
        providerId: this.id,
        serviceCode: "MANUAL_TELEGRAM",
        providerName: this.name,
        serviceName: "Индивидуальный расчёт куратором в Telegram",
        deliveryType: "courier",
        price: 0,
        currency: "RUB",
        minDays: 1,
        maxDays: 7,
        quoteId: `manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
    ]
  }
}
