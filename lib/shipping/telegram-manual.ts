import { ShippingProvider, ShippingQuote, ShippingQuoteInput } from "./types"

/**
 * Manual delivery provider — no fake prices.
 * Returns options where price is null and requiresDeliveryAgreement = true.
 * The actual price and timing are agreed in Telegram.
 */
export class TelegramManualProvider implements ShippingProvider {
  id = "telegram_manual"
  name = "Согласование доставки"

  isConfigured(): boolean {
    return true // Always available as fallback
  }

  async getQuotes(_input: ShippingQuoteInput): Promise<ShippingQuote[]> {
    const now = new Date().toISOString()
    // Manual quotes expire in 24h (user can always recalculate)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    return [
      {
        providerId: "cdek_manual",
        serviceCode: "CDEK_MANUAL",
        providerName: "СДЭК",
        serviceName: "СДЭК — до ПВЗ или курьером",
        deliveryType: "pickup",
        // price: null means "стоимость согласовывается"
        price: null,
        requiresDeliveryAgreement: true,
        currency: "RUB",
        minDays: null,
        maxDays: null,
        agreementNote: "Стоимость и срок доставки будут рассчитаны и согласованы в Telegram",
        quoteId: `cdek_manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
      {
        providerId: "yandex_manual",
        serviceCode: "YANDEX_MANUAL",
        providerName: "Яндекс Маркет / Яндекс Доставка",
        serviceName: "Яндекс — курьером или до ПВЗ",
        deliveryType: "courier",
        price: null,
        requiresDeliveryAgreement: true,
        currency: "RUB",
        minDays: null,
        maxDays: null,
        agreementNote: "Стоимость и срок доставки будут рассчитаны и согласованы в Telegram",
        quoteId: `yandex_manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
      {
        providerId: "ozon_manual",
        serviceCode: "OZON_MANUAL",
        providerName: "Ozon / Авито Доставка",
        serviceName: "Ozon или Авито — через пункт выдачи",
        deliveryType: "pickup",
        price: null,
        requiresDeliveryAgreement: true,
        currency: "RUB",
        minDays: null,
        maxDays: null,
        agreementNote: "Стоимость и срок доставки будут рассчитаны и согласованы в Telegram",
        quoteId: `ozon_manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
      {
        providerId: "telegram_manual",
        serviceCode: "MANUAL_TELEGRAM",
        providerName: "Персональное согласование",
        serviceName: "Любая служба — расчёт в Telegram",
        deliveryType: "courier",
        price: null,
        requiresDeliveryAgreement: true,
        currency: "RUB",
        minDays: null,
        maxDays: null,
        agreementNote: "Стоимость и срок доставки будут рассчитаны и согласованы в Telegram",
        quoteId: `manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
    ]
  }
}
